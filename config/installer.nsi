;-------------------------------------------------------------------;
;                                                                   ;
; Appcelerator Titanium Example Application Installer for Win32     ;
;                                                                   ;
;-------------------------------------------------------------------;
;
; Copyright (c) 2008, Appcelerator, Inc.
; All rights reserved.
; 
; Redistribution and use in source and binary forms, with or without modification,
; are permitted provided that the following conditions are met:
; 
;     * Redistributions of source code must retain the above copyright notice,
;       this list of conditions and the following disclaimer.
; 
;     * Redistributions in binary form must reproduce the above copyright notice,
;       this list of conditions and the following disclaimer in the documentation
;       and/or other materials provided with the distribution.
; 
;     * Neither the name of Appcelerator, Inc. nor the names of its
;       contributors may be used to endorse or promote products derived from this
;       software without specific prior written permission.
; 
; THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
; ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
; WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
; DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
; ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
; (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
; ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
; (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
; SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.;

!include "MUI.nsh"

Name "${APPNAME}"
OutFile "installer.exe"

CRCCheck on
XPStyle on
ShowInstDetails show

VIProductVersion "${VERSION}"
VIAddVersionKey ProductName "${NAME}"
VIAddVersionKey ProductVersion "${VERSION}"
VIAddVersionKey CompanyName "${COMPANY}"
VIAddVersionKey CompanyWebsite "${URL}"
VIAddVersionKey FileVersion ""
VIAddVersionKey FileDescription ""
VIAddVersionKey LegalCopyright ""

!define REGKEY "Software\${NAME}"
InstallDirRegKey HKLM "${REGKEY}" "DefaultPath"
InstallDir "$PROGRAMFILES\${NAME}"

BrandingText "Titanium Installer by Nullsoft"

Icon "${APPNAME}.ico"
LicenseForceSelection radiobuttons
RequestExecutionLevel admin
AutoCloseWindow false
    
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "sidebar.bmp"
!define MUI_ABORTWARNING
!define MUI_ICON "${APPNAME}.ico"
!define MUI_UNICON "${APPNAME}.ico"


!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH
  
!insertmacro MUI_LANGUAGE "English"


Section

  SectionIn RO
  SetOutPath "$INSTDIR"
  
  File app\*.exe
  File app\icudt38.dll
  File app\titanium.dll
  File /r app\Resources
  File /r app\plugins

  ;Store installation folder
  WriteRegStr HKCU "${REGKEY}" "" $INSTDIR

  ;Create uninstall information in Control Panel Add/Remove programs 
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "DisplayName" "${NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "Publisher" "${COMPANY}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "URLInfoAbout" "${URL}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "URLUpdateInfo" "${URL}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "HelpLink" "${URL}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"

  ;Create shortcuts
  CreateShortCut "$SMPROGRAMS\${NAME}\${NAME}.lnk" "$INSTDIR\${APPNAME}.exe"
  CreateShortCut "$SMPROGRAMS\${NAME}\Uninstall ${NAME}.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${NAME}.lnk" "$INSTDIR\${APPNAME}.exe"
  
  ;Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

Function .onInstSuccess
	; TODO: launch the app here
FunctionEnd

Section "Uninstall"

  Delete "$SMPROGRAMS\${NAME}\${NAME}.lnk" 
  Delete "$SMPROGRAMS\${NAME}\Uninstall ${NAME}.lnk" 
  Delete "$DESKTOP\${NAME}.lnk" 
  
  RMDir /r "$INSTDIR\*"
  RMDir /r "$INSTDIR"

  DeleteRegKey /ifempty HKCU "${REGKEY}"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NAME}"

SectionEnd


