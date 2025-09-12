@echo off
chcp 65001 >nul
title HTML文件referrerpolicy属性批量删除工具

echo.
echo ========================================
echo    HTML文件referrerpolicy属性删除工具
echo ========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查是否存在HTML文件
dir /b *.html >nul 2>&1
if errorlevel 1 (
    echo ❌ 当前目录下没有找到HTML文件！
    echo.
    pause
    exit /b 1
)

echo 🔍 正在扫描HTML文件...
echo.

REM 运行PowerShell脚本
powershell -ExecutionPolicy Bypass -File "remove_referrerpolicy_run.ps1"

echo.
echo ========================================
echo 处理完成！按任意键退出...
echo ========================================
pause >nul 