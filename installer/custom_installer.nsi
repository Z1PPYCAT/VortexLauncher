Unicode True

!include "MUI2.nsh"
!include "FileFunc.nsh"

; ── APP INFO ──
Name "Vortex Launcher"
OutFile "..\dist\VortexLauncher-Setup-0.1.0-Custom.exe"
InstallDir "$PROGRAMFILES64\Vortex Launcher"
InstallDirRegKey HKLM "Software\VortexLauncher" ""
RequestExecutionLevel admin

; ── VERSION INFO ──
VIProductVersion "0.1.0.0"
VIAddVersionKey "ProductName" "Vortex Launcher"
VIAddVersionKey "CompanyName" "TheTechGuy"
VIAddVersionKey "FileDescription" "Vortex Launcher Setup"
VIAddVersionKey "FileVersion" "0.1.0"
VIAddVersionKey "ProductVersion" "0.1.0"
VIAddVersionKey "LegalCopyright" "Copyright 2026 TheTechGuy"

; ── MUI SETTINGS ──
!define MUI_ABORTWARNING
!define MUI_ICON "vortex.ico"
!define MUI_UNICON "vortex.ico"

; Custom colors - gold and black theme
!define MUI_BGCOLOR "0D0D08"
!define MUI_TEXTCOLOR "D4AF37"

; Header image
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERIMAGE_BITMAP "vortex_logo.png"
!define MUI_HEADERIMAGE_UNBITMAP "vortex_logo.png"

; Welcome/Finish page image (sidebar)
!define MUI_WELCOMEFINISHPAGE_BITMAP "sidebar.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "sidebar.bmp"

; ── PAGES ──
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ── WELCOME PAGE TEXT ──
!define MUI_WELCOMEPAGE_TITLE "Welcome to Vortex Launcher"
!define MUI_WELCOMEPAGE_TEXT "Vortex Launcher is the ultimate game enhancement platform for solo and co-op gaming.$\r$\n$\r$\nFeatures:$\r$\n  • Game trainer auto-download$\r$\n  • Steam library integration$\r$\n  • KeyAuth license protection$\r$\n  • Black and gold UI$\r$\n$\r$\nClick Next to continue."

; ── FINISH PAGE ──
!define MUI_FINISHPAGE_TITLE "Vortex Launcher Installed!"
!define MUI_FINISHPAGE_TEXT "Vortex Launcher has been installed successfully.$\r$\n$\r$\nClick Finish to launch Vortex Launcher."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Vortex Launcher.exe"
!define MUI_FINISHPAGE_LINK "Join our Discord"
!define MUI_FINISHPAGE_LINK_LOCATION "https://discord.gg/wdrj5auhEB"

; ── INSTALL SECTION ──
Section "Vortex Launcher" SecMain
    SetOutPath "$INSTDIR"
    
    ; Copy all files from unpacked directory
    File /r "..\dist\win-unpacked\*.*"
    
    ; Create AppData folder
    CreateDirectory "$APPDATA\Vortex"
    
    ; Create shortcuts
    CreateShortcut "$DESKTOP\Vortex Launcher.lnk" "$INSTDIR\Vortex Launcher.exe" "" "$INSTDIR\Vortex Launcher.exe"
    CreateDirectory "$SMPROGRAMS\Vortex Launcher"
    CreateShortcut "$SMPROGRAMS\Vortex Launcher\Vortex Launcher.lnk" "$INSTDIR\Vortex Launcher.exe"
    CreateShortcut "$SMPROGRAMS\Vortex Launcher\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    
    ; Write registry
    WriteRegStr HKLM "Software\VortexLauncher" "" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "DisplayName" "Vortex Launcher"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "DisplayIcon" "$INSTDIR\Vortex Launcher.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "Publisher" "TheTechGuy"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "DisplayVersion" "0.1.0"
    
    ; Get install size
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher" "EstimatedSize" "$0"
    
    ; Write uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ── UNINSTALL SECTION ──
Section "Uninstall"
    MessageBox MB_YESNO "Remove all Vortex data and settings?" IDNO skip
    RMDir /r "$APPDATA\Vortex"
    skip:
    
    RMDir /r "$INSTDIR"
    Delete "$DESKTOP\Vortex Launcher.lnk"
    RMDir /r "$SMPROGRAMS\Vortex Launcher"
    
    DeleteRegKey HKLM "Software\VortexLauncher"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VortexLauncher"
SectionEnd
