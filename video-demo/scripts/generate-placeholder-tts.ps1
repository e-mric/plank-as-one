param(
  [string]$ScriptPath = (Join-Path $PSScriptRoot '..\narration-eleven-v3.txt'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\input\narration-placeholder.wav')
)

$rawNarration = Get-Content -Raw -LiteralPath $ScriptPath
$spokenSection = ($rawNarration -split '--- SCRIPT ---', 2)[-1]
$spokenText = ($spokenSection -replace '\[[^\]]+\]', '' -replace '\s+', ' ').Trim()
$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthesizer.Rate = 0
$synthesizer.Volume = 100
$synthesizer.SetOutputToWaveFile($OutputPath)
$synthesizer.Speak($spokenText)
$synthesizer.Dispose()
Write-Output "Placeholder narration: $OutputPath"
