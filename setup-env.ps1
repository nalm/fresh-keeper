# Vercel & Supabase 자동 연동 및 재배포 스크립트 (Windows PowerShell)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FreshKeeper - Vercel & Supabase 환경 변수 설정 스크립트" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 사용자 입력 받기
$url = Read-Host "1. Supabase Project URL을 입력하세요 (예: https://xxxx.supabase.co)"
$key = Read-Host "2. Supabase Anon API Key를 입력하세요"

if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) {
    Write-Host "[오류] URL 또는 Key가 입력되지 않았습니다. 설정을 중단합니다." -ForegroundColor Red
    Exit
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "Vercel 대시보드에 환경 변수를 등록합니다..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Vercel env add (값은 파이프라인으로 stdin 전달)
Write-Host ">> SUPABASE_URL 등록 중..." -ForegroundColor Gray
$url | vercel env add SUPABASE_URL production
$url | vercel env add SUPABASE_URL preview
$url | vercel env add SUPABASE_URL development

Write-Host ">> SUPABASE_ANON_KEY 등록 중..." -ForegroundColor Gray
$key | vercel env add SUPABASE_ANON_KEY production
$key | vercel env add SUPABASE_ANON_KEY preview
$key | vercel env add SUPABASE_ANON_KEY development

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "환경 변수 변경 사항 반영을 위해 Vercel 실배포를 진행합니다..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Vercel 실서버 프로덕션 배포 진행
vercel --prod --yes

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   연동 및 재배포가 모두 완료되었습니다!" -ForegroundColor Green
Write-Host "   이제 아래 주소에서 정상 동작을 확인해 보세요." -ForegroundColor Green
Write-Host "   👉 라이브 사이트: https://fresh-keeper-app.vercel.app" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
