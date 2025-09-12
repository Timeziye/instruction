# Simple HTML referrerpolicy removal script
# UTF-8 encoding

$CurrentPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $CurrentPath

Write-Host "HTML Referrer Policy Removal Tool" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

$htmlFiles = Get-ChildItem -Path . -Filter *.html

if ($htmlFiles.Count -eq 0) {
    Write-Host "No HTML files found in current directory!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "Found $($htmlFiles.Count) HTML files:" -ForegroundColor Yellow
foreach ($file in $htmlFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor Cyan
}
Write-Host ""

$processedCount = 0
$totalReferrerCount = 0

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $beforeCount = ([regex]::Matches($content, 'referrerpolicy="no-referrer"')).Count
        $beforeCount += ([regex]::Matches($content, "referrerpolicy='no-referrer'")).Count
        $originalContent = $content
        
        $content = $content -replace '\s+referrerpolicy="no-referrer"', ''
        $content = $content -replace 'referrerpolicy="no-referrer"\s+', ''
        $content = $content -replace '\s+referrerpolicy=''no-referrer''', ''
        $content = $content -replace 'referrerpolicy=''no-referrer''\s+', ''
        
        $afterCount = ([regex]::Matches($content, 'referrerpolicy="no-referrer"')).Count
        $afterCount += ([regex]::Matches($content, "referrerpolicy='no-referrer'")).Count
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $removedCount = $beforeCount - $afterCount
            Write-Host "  SUCCESS: $($file.Name) - Removed $removedCount referrerpolicy attributes" -ForegroundColor Green
            $processedCount++
            $totalReferrerCount += $removedCount
        } else {
            Write-Host "  SKIP: $($file.Name) - No referrerpolicy attributes found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ERROR: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Green
Write-Host "COMPLETED!" -ForegroundColor Green
Write-Host "Files processed: $processedCount" -ForegroundColor Cyan
Write-Host "Total attributes removed: $totalReferrerCount" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Green 