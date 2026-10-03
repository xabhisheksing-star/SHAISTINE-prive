param (
    [int]$Port = 8080,
    [string]$Directory = "."
)

$baseDir = (Resolve-Path $Directory).Path
$csPath = Join-Path $PSScriptRoot "StaticServer.cs"

# Check if port is already running
$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Output "SERVER_READY: http://localhost:$Port/ (Server is already running on port $Port)"
    Write-Output "Open your browser at: http://localhost:$Port/"
    return
}

Add-Type -Path $csPath

try {
    $server = New-Object StaticServer($baseDir, $Port)
    $server.Start()
    Write-Output "SERVER_READY: http://localhost:$Port/"
    Write-Output "Access the website at: http://localhost:$Port/"
    Write-Output "Press Ctrl+C to stop the server."

    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Error "Failed to start server: $_"
} finally {
    if ($server) {
        $server.Stop()
    }
}

