!macro customInstall
    CreateDirectory "$APPDATA\Vortex"
    CreateShortcut "$DESKTOP\Vortex Launcher.lnk" "$INSTDIR\Vortex Launcher.exe"
    CreateDirectory "$SMPROGRAMS\Vortex Launcher"
    CreateShortcut "$SMPROGRAMS\Vortex Launcher\Vortex Launcher.lnk" "$INSTDIR\Vortex Launcher.exe"
    CreateShortcut "$SMPROGRAMS\Vortex Launcher\Uninstall.lnk" "$INSTDIR\Uninstall Vortex Launcher.exe"
!macroend

!macro customUnInstall
    MessageBox MB_YESNO "Remove all Vortex data and settings?" IDNO skip
    RMDir /r "$APPDATA\Vortex"
    skip:
    Delete "$DESKTOP\Vortex Launcher.lnk"
    RMDir /r "$SMPROGRAMS\Vortex Launcher"
!macroend

!macro customInit
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Vortex Launcher" "UninstallString"
    StrCmp $R0 "" done
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
        "Vortex Launcher is already installed.$\n$\nClick OK to upgrade." \
        IDOK done
    Abort
    done:
!macroend
