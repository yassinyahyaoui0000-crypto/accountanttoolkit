param(
    [string]$UrlsPath = ".\\seo\\priority-urls.txt",
    [string]$OutputCsvPath
)

function Invoke-WithoutAutoRedirect {
    param(
        [string]$Url
    )

    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Method = "GET"
    $request.AllowAutoRedirect = $false
    $request.Timeout = 30000
    $request.UserAgent = "AccountantToolkitSEOObserver/1.0"

    try {
        $response = [System.Net.HttpWebResponse]$request.GetResponse()
    }
    catch [System.Net.WebException] {
        if (-not $_.Exception.Response) {
            throw
        }

        $response = [System.Net.HttpWebResponse]$_.Exception.Response
    }

    try {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $content = $reader.ReadToEnd()
    }
    finally {
        if ($reader) {
            $reader.Dispose()
        }

        $response.Close()
    }

    return [PSCustomObject]@{
        StatusCode = [int]$response.StatusCode
        Content = [string]$content
        Headers = $response.Headers
        ResponseUri = [string]$response.ResponseUri.AbsoluteUri
    }
}

function Resolve-RedirectTarget {
    param(
        [string]$Url,
        [int]$MaxRedirects = 5
    )

    $currentUrl = $Url

    for ($attempt = 0; $attempt -le $MaxRedirects; $attempt++) {
        $response = Invoke-WithoutAutoRedirect -Url $currentUrl
        $statusCode = [int]$response.StatusCode

        if ($statusCode -in @(301, 302, 307, 308)) {
            $location = $response.Headers["Location"]
            if (-not $location) {
                throw "Redirect response missing Location header for $currentUrl"
            }

            if ([Uri]::IsWellFormedUriString($location, [UriKind]::Absolute)) {
                $currentUrl = $location
            }
            else {
                $currentUrl = ([Uri]::new([Uri]$currentUrl, $location)).AbsoluteUri
            }

            continue
        }

        return [PSCustomObject]@{
            StatusCode = $statusCode
            FinalUrl = $currentUrl
            Content = [string]$response.Content
        }
    }

    throw "Too many redirects for $Url"
}

function Get-MatchValue {
    param(
        [string]$Content,
        [string]$Pattern
    )

    $match = [regex]::Match($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ""
}

if (-not (Test-Path -LiteralPath $UrlsPath)) {
    throw "URLs file not found: $UrlsPath"
}

$urls = Get-Content -LiteralPath $UrlsPath | Where-Object { $_.Trim() -ne "" }
$results = @()

foreach ($url in $urls) {
    try {
        $request = Resolve-RedirectTarget -Url $url
        $finalUrl = $request.FinalUrl
        $content = [string]$request.Content
        $title = Get-MatchValue -Content $content -Pattern "<title>\s*(.*?)\s*</title>"
        $canonical = Get-MatchValue -Content $content -Pattern "<link[^>]*rel=['""]canonical['""][^>]*href=['""]([^'""]+)['""]"
        $robots = Get-MatchValue -Content $content -Pattern "<meta[^>]*name=['""]robots['""][^>]*content=['""]([^'""]+)['""]"

        $results += [PSCustomObject]@{
            Url = $url
            FinalUrl = $finalUrl
            Redirected = ($finalUrl -ne $url)
            Status = [int]$request.StatusCode
            Canonical = $canonical
            CanonicalMatchesUrl = ($canonical -eq $finalUrl)
            CanonicalMatchesRequestedUrl = ($canonical -eq $url)
            Robots = $robots
            HasNoindex = ($robots -match "(^|,\s*)noindex(\s*,|$)")
            Title = $title
            Error = ""
        }
    }
    catch {
        $statusCode = ""
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        $results += [PSCustomObject]@{
            Url = $url
            FinalUrl = ""
            Redirected = $false
            Status = if ($statusCode) { $statusCode } else { "ERROR" }
            Canonical = ""
            CanonicalMatchesUrl = $false
            CanonicalMatchesRequestedUrl = $false
            Robots = ""
            HasNoindex = $false
            Title = ""
            Error = $_.Exception.Message
        }
    }
}

Write-Output ""
Write-Output "Priority URL live check"
Write-Output "-----------------------"
$results | Select-Object Url, Redirected, Status, CanonicalMatchesUrl, HasNoindex, FinalUrl | Format-Table -AutoSize

$canonicalDrift = $results | Where-Object { $_.Error -eq "" -and -not $_.CanonicalMatchesUrl }
if ($canonicalDrift) {
    Write-Output ""
    Write-Output "Canonical Drift"
    Write-Output "---------------"
    $canonicalDrift | Select-Object Url, FinalUrl, Canonical, CanonicalMatchesRequestedUrl | Format-List
}

$errors = $results | Where-Object { $_.Error -ne "" }
if ($errors) {
    Write-Output ""
    Write-Output "Errors"
    Write-Output "------"
    $errors | Select-Object Url, Error | Format-Table -Wrap -AutoSize
}

try {
    $robotsResponse = Invoke-WebRequest -Uri "https://accountanttoolkit.com/robots.txt" -UseBasicParsing -TimeoutSec 30
    $sitemapResponse = Invoke-WebRequest -Uri "https://accountanttoolkit.com/sitemap.xml" -UseBasicParsing -TimeoutSec 30
    $sitemapLastmod = Get-MatchValue -Content ([string]$sitemapResponse.Content) -Pattern "<lastmod>\s*(.*?)\s*</lastmod>"

    Write-Output ""
    Write-Output "Site-wide crawl signals"
    Write-Output "-----------------------"
    Write-Output "robots.txt status: $($robotsResponse.StatusCode)"
    Write-Output "sitemap.xml status: $($sitemapResponse.StatusCode)"
    Write-Output "first sitemap lastmod: $sitemapLastmod"
}
catch {
    Write-Output ""
    Write-Output "Site-wide crawl signals"
    Write-Output "-----------------------"
    Write-Output "Could not fetch robots.txt or sitemap.xml: $($_.Exception.Message)"
}

if ($OutputCsvPath) {
    $outputDir = Split-Path -Parent $OutputCsvPath
    if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }

    $results | Export-Csv -LiteralPath $OutputCsvPath -NoTypeInformation
    Write-Output ""
    Write-Output "Saved CSV snapshot to $OutputCsvPath"
}
