param(
  [int]$DaysBack = 365,
  [int]$MinDaysPerWeek = 2,
  [int]$MaxDaysPerWeek = 3,
  [int]$MinCommitsPerDay = 1,
  [int]$MaxCommitsPerDay = 10,
  [int]$MaxTotalCommits = 500,
  [int]$Seed = 0
)

# Random generator (reproducible if Seed provided)
if ($Seed -ne 0) { $rand = [System.Random]::new($Seed) } else { $rand = [System.Random]::new() }
function RandInt([int]$a, [int]$b) { return $rand.Next($a, $b + 1) }

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { throw "Not inside a git repo." }

New-Item -ItemType Directory -Force -Path "sim" | Out-Null
if (-not (Test-Path "sim\activity.log")) { New-Item -ItemType File -Path "sim\activity.log" | Out-Null }

$now = Get-Date
$start = (Get-Date).AddDays(-$DaysBack).Date.AddHours(12)

$weekStart = $start
$commitsTotal = 0

while ($weekStart -lt $now -and $commitsTotal -lt $MaxTotalCommits) {

  $daysThisWeek = RandInt $MinDaysPerWeek $MaxDaysPerWeek

  $chosen = New-Object System.Collections.Generic.HashSet[int]
  while ($chosen.Count -lt $daysThisWeek) {
    [void]$chosen.Add((RandInt 0 6))
  }

  foreach ($wd in $chosen) {
    if ($commitsTotal -ge $MaxTotalCommits) { break }

    $day = $weekStart.AddDays($wd)
    if ($day -gt $now) { continue }

    $commitsToday = RandInt $MinCommitsPerDay $MaxCommitsPerDay

    $baseHour = RandInt 10 20
    $baseMin  = RandInt 0 59
    $baseSec  = RandInt 0 59

    for ($i = 1; $i -le $commitsToday -and $commitsTotal -lt $MaxTotalCommits; $i++) {

      $offsetMin = RandInt 0 90
      $dt = (Get-Date $day).Date.AddHours($baseHour).AddMinutes($baseMin).AddSeconds($baseSec).AddMinutes($offsetMin)

      $commitDate = $dt.ToString("yyyy-MM-ddTHH:mm:sszzzz").Replace(":", "")

      Add-Content -Path "sim\activity.log" -Value "$commitDate | commit $i/$commitsToday"

      git add "sim/activity.log" *> $null

      $env:GIT_AUTHOR_DATE = $commitDate
      $env:GIT_COMMITTER_DATE = $commitDate

      git commit -m ("sim: activity {0} ({1}/{2})" -f $day.ToString("yyyy-MM-dd"), $i, $commitsToday) *> $null

      $commitsTotal++
    }
  }

  $weekStart = $weekStart.AddDays(7)
}

Remove-Item Env:\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

git push origin main
Write-Host "Done. Created $commitsTotal commits."