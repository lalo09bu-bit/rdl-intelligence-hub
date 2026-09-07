; ============================================================
; RDL INTELLIGENCE HUB - OFFICIAL INNO SETUP SCRIPT (.ISS)
; Lanzamiento 100% Silencioso y Estético (Sin Cuadro Negro CMD)
; ============================================================

#define MyAppName "RDL Intelligence Hub"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Reclutamiento e Integracion de Talento (RDL)"
#define MyAppURL "https://rdl.com.mx"
#define MyAppExeName "Iniciar RDL Intelligence Hub.vbs"

[Setup]
AppId={{D37E860F-992A-4F7D-8F25-C7E6C1004D01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DefaultDirName={userappdata}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=OutputInstaller
OutputBaseFilename=RDL_Intelligence_Hub_Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
SetupIconFile=public\Logo RDL.ico

[Languages]
Name: "default"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "OutputInstaller\RDL_Intelligence_Hub_Package\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Logo RDL.ico"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\Logo RDL.ico"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: shellexec postinstall skipifsilent
