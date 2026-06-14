# Vercel & Supabase Environment Setup Script (Windows PowerShell compatible)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FreshKeeper - Vercel & Supabase Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Receive inputs from user
$url = Read-Host "1. Enter your Supabase Project URL (e.g., https://xxxx.supabase.co)"
$key = Read-Host "2. Enter your Supabase Anon API Key"

if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) {
    Write-Host "[ERROR] URL or Key is empty. Aborting setup." -ForegroundColor Red
    Exit
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "Cleaning up old database environment variables..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Remove existing variables first to bypass overwrite prompts (suppress error outputs)
Write-Host ">> Removing old SUPABASE_URL variables..." -ForegroundColor Gray
vercel env rm SUPABASE_URL production -y 2>$null
vercel env rm SUPABASE_URL preview -y 2>$null
vercel env rm SUPABASE_URL development -y 2>$null

Write-Host ">> Removing old SUPABASE_ANON_KEY variables..." -ForegroundColor Gray
vercel env rm SUPABASE_ANON_KEY production -y 2>$null
vercel env rm SUPABASE_ANON_KEY preview -y 2>$null
vercel env rm SUPABASE_ANON_KEY development -y 2>$null

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "Adding new environment variables to Vercel..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Vercel env add (pass values via stdin pipeline)
Write-Host ">> Registering SUPABASE_URL..." -ForegroundColor Gray
$url | vercel env add SUPABASE_URL production
$url | vercel env add SUPABASE_URL preview
$url | vercel env add SUPABASE_URL development

Write-Host ">> Registering SUPABASE_ANON_KEY..." -ForegroundColor Gray
$key | vercel env add SUPABASE_ANON_KEY production
$key | vercel env add SUPABASE_ANON_KEY preview
$key | vercel env add SUPABASE_ANON_KEY development

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "Deploying changes to Vercel production..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Deploy to Vercel production environment
vercel --prod --yes

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Setup and redeployment successfully completed!" -ForegroundColor Green
Write-Host "   Check your live site here:" -ForegroundColor Green
Write-Host "   👉 Live Site: https://fresh-keeper-app.vercel.app" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
