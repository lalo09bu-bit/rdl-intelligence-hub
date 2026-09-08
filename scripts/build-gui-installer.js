import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, '..');
const outputInstallerDir = path.join(projectDir, 'OutputInstaller');
const targetExe = path.join(outputInstallerDir, 'RDL_Intelligence_Hub_Setup.exe');
const desktopExe = path.join(process.env.USERPROFILE, 'OneDrive - RECLUTAMIENTO E INTEGRACION DE TALENTO', 'Escritorio', 'RDL_Intelligence_Hub_Setup.exe');
const tempZip = path.join(outputInstallerDir, 'rdl_payload.zip');
const csharpFile = path.join(outputInstallerDir, 'GuiInstallerSource.cs');
const pkgDir = path.join(outputInstallerDir, 'RDL_Intelligence_Hub_Package');

console.log('========================================================================');
console.log('🖥️ COMPILANDO ASISTENTE GRÁFICO (GUI WIZARD) .EXE DE RDL HUB');
console.log('========================================================================\n');

// 1. Siempre recrear el Zip comprimido para garantizar la versión más reciente
if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
}
console.log('⚡ [1/3] Comprimiendo la plataforma RDL actualizada en paquete ZIP...');
const psZipCmd = `powershell -Command "Compress-Archive -Path '${pkgDir.replace(/\\/g, '\\\\')}\\*' -DestinationPath '${tempZip.replace(/\\/g, '\\\\')}' -Force"`;
execSync(psZipCmd, { cwd: projectDir });

// 2. Preparar el código C# WinForms GUI Wizard con recurso binario incrustado
console.log('⚙️ [2/3] Generando código fuente C# WinForms con recurso embebido...');

const csharpSource = `using System;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.ComponentModel;
using System.Windows.Forms;

namespace RDLInstallerGUI {
    public class InstallerForm : Form {
        private Panel panelHeader;
        private Label lblHeaderTitle;
        private Label lblHeaderSubtitle;
        private PictureBox picLogo;

        private Panel panelStep1;
        private Label lblWelcome;
        private Label lblWelcomeDesc;

        private Panel panelStep2;
        private Label lblSelectDir;
        private TextBox txtInstallDir;
        private Button btnBrowse;
        private CheckBox chkCreateShortcut;

        private Panel panelStep3;
        private Label lblInstalling;
        private ProgressBar progressBar;
        private Label lblProgressStatus;

        private Panel panelStep4;
        private Label lblSuccess;
        private Label lblSuccessDesc;
        private CheckBox chkLaunchApp;

        private Button btnNext;
        private Button btnBack;
        private Button btnCancel;

        private int currentStep = 1;
        private BackgroundWorker bgWorker;
        private string finalInstallDir = "";

        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }

        public InstallerForm() {
            InitializeComponent();
        }

        private void InitializeComponent() {
            this.Text = "Asistente de Instalación - RDL Intelligence Hub";
            this.Size = new Size(620, 460);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = true;
            this.BackColor = Color.FromArgb(10, 25, 47);
            this.ForeColor = Color.White;

            // Cargar Icono si existe en memoria
            try {
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("rdl_payload.zip")) {
                    if (stream != null) {
                        using (ZipArchive archive = new ZipArchive(stream)) {
                            var iconEntry = archive.GetEntry("Logo RDL.ico");
                            if (iconEntry != null) {
                                using (var iconStream = iconEntry.Open()) {
                                    using (MemoryStream ms = new MemoryStream()) {
                                        iconStream.CopyTo(ms);
                                        ms.Position = 0;
                                        this.Icon = new Icon(ms);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch {}

            // Header Corporativo
            panelHeader = new Panel();
            panelHeader.Size = new Size(620, 75);
            panelHeader.Location = new Point(0, 0);
            panelHeader.BackColor = Color.FromArgb(15, 45, 74);

            picLogo = new PictureBox();
            picLogo.Size = new Size(50, 50);
            picLogo.Location = new Point(20, 12);
            picLogo.SizeMode = PictureBoxSizeMode.Zoom;

            try {
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("rdl_payload.zip")) {
                    if (stream != null) {
                        using (ZipArchive archive = new ZipArchive(stream)) {
                            var imgEntry = archive.GetEntry("Logo RDL.png");
                            if (imgEntry != null) {
                                using (var imgStream = imgEntry.Open()) {
                                    using (MemoryStream ms = new MemoryStream()) {
                                        imgStream.CopyTo(ms);
                                        ms.Position = 0;
                                        picLogo.Image = Image.FromStream(ms);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch {}

            lblHeaderTitle = new Label();
            lblHeaderTitle.Text = "RDL INTELLIGENCE HUB";
            lblHeaderTitle.Font = new Font("Segoe UI", 12, FontStyle.Bold);
            lblHeaderTitle.ForeColor = Color.FromArgb(0, 230, 118);
            lblHeaderTitle.Location = new Point(80, 16);
            lblHeaderTitle.AutoSize = true;

            lblHeaderSubtitle = new Label();
            lblHeaderSubtitle.Text = "Asistente de Instalacion Oficial de Windows";
            lblHeaderSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblHeaderSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblHeaderSubtitle.Location = new Point(80, 40);
            lblHeaderSubtitle.AutoSize = true;

            panelHeader.Controls.Add(picLogo);
            panelHeader.Controls.Add(lblHeaderTitle);
            panelHeader.Controls.Add(lblHeaderSubtitle);

            // STEP 1: BIENVENIDA
            panelStep1 = new Panel();
            panelStep1.Size = new Size(580, 280);
            panelStep1.Location = new Point(20, 90);

            lblWelcome = new Label();
            lblWelcome.Text = "¡Bienvenido al Instalador de RDL Intelligence Hub!";
            lblWelcome.Font = new Font("Segoe UI", 13, FontStyle.Bold);
            lblWelcome.ForeColor = Color.White;
            lblWelcome.Location = new Point(10, 20);
            lblWelcome.AutoSize = true;

            lblWelcomeDesc = new Label();
            lblWelcomeDesc.Text = "Este asistente guiara la instalacion de la plataforma corporativa RDL Intelligence Hub en tu computadora.\\n\\nLa aplicacion quedara instalada y lista para ser ejecutada desde tu Escritorio con notificaciones y comunicacion en tiempo real.\\n\\nHaz clic en 'Siguiente' para continuar.";
            lblWelcomeDesc.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblWelcomeDesc.ForeColor = Color.FromArgb(203, 213, 225);
            lblWelcomeDesc.Location = new Point(12, 60);
            lblWelcomeDesc.Size = new Size(550, 180);

            panelStep1.Controls.Add(lblWelcome);
            panelStep1.Controls.Add(lblWelcomeDesc);

            // STEP 2: SELECCIÓN DE DIRECTORIO ("DONDE DESEAS INSTALAR")
            panelStep2 = new Panel();
            panelStep2.Size = new Size(580, 280);
            panelStep2.Location = new Point(20, 90);
            panelStep2.Visible = false;

            lblSelectDir = new Label();
            lblSelectDir.Text = "Selecciona la carpeta donde deseas instalar RDL Intelligence Hub:";
            lblSelectDir.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            lblSelectDir.ForeColor = Color.White;
            lblSelectDir.Location = new Point(10, 20);
            lblSelectDir.AutoSize = true;

            txtInstallDir = new TextBox();
            string defaultDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RDL Intelligence Hub");
            txtInstallDir.Text = defaultDir;
            txtInstallDir.Font = new Font("Segoe UI", 9.5f);
            txtInstallDir.Location = new Point(12, 60);
            txtInstallDir.Size = new Size(430, 26);

            btnBrowse = new Button();
            btnBrowse.Text = "Examinar...";
            btnBrowse.Font = new Font("Segoe UI", 9f);
            btnBrowse.Location = new Point(450, 58);
            btnBrowse.Size = new Size(110, 28);
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.BackColor = Color.FromArgb(30, 41, 59);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.Click += BtnBrowse_Click;

            chkCreateShortcut = new CheckBox();
            chkCreateShortcut.Text = "Crear un acceso directo en el Escritorio con el logotipo oficial RDL";
            chkCreateShortcut.Checked = true;
            chkCreateShortcut.Font = new Font("Segoe UI", 9f);
            chkCreateShortcut.Location = new Point(12, 120);
            chkCreateShortcut.AutoSize = true;

            panelStep2.Controls.Add(lblSelectDir);
            panelStep2.Controls.Add(txtInstallDir);
            panelStep2.Controls.Add(btnBrowse);
            panelStep2.Controls.Add(chkCreateShortcut);

            // STEP 3: PROGRESO DE INSTALACIÓN
            panelStep3 = new Panel();
            panelStep3.Size = new Size(580, 280);
            panelStep3.Location = new Point(20, 90);
            panelStep3.Visible = false;

            lblInstalling = new Label();
            lblInstalling.Text = "Instalando RDL Intelligence Hub...";
            lblInstalling.Font = new Font("Segoe UI", 11, FontStyle.Bold);
            lblInstalling.ForeColor = Color.White;
            lblInstalling.Location = new Point(10, 30);
            lblInstalling.AutoSize = true;

            progressBar = new ProgressBar();
            progressBar.Location = new Point(12, 80);
            progressBar.Size = new Size(545, 24);
            progressBar.Style = ProgressBarStyle.Marquee;

            lblProgressStatus = new Label();
            lblProgressStatus.Text = "Extrayendo componentes y configurando base de datos SQLite...";
            lblProgressStatus.Font = new Font("Segoe UI", 9f);
            lblProgressStatus.ForeColor = Color.FromArgb(148, 163, 184);
            lblProgressStatus.Location = new Point(12, 115);
            lblProgressStatus.AutoSize = true;

            panelStep3.Controls.Add(lblInstalling);
            panelStep3.Controls.Add(progressBar);
            panelStep3.Controls.Add(lblProgressStatus);

            // STEP 4: FINALIZACIÓN
            panelStep4 = new Panel();
            panelStep4.Size = new Size(580, 280);
            panelStep4.Location = new Point(20, 90);
            panelStep4.Visible = false;

            lblSuccess = new Label();
            lblSuccess.Text = "¡Instalacion completada con exito!";
            lblSuccess.Font = new Font("Segoe UI", 13, FontStyle.Bold);
            lblSuccess.ForeColor = Color.FromArgb(0, 230, 118);
            lblSuccess.Location = new Point(10, 20);
            lblSuccess.AutoSize = true;

            lblSuccessDesc = new Label();
            lblSuccessDesc.Text = "RDL Intelligence Hub se ha instalado correctamente en tu equipo.\\n\\nSe ha creado el acceso directo oficial en tu Escritorio para iniciar en 1 solo clic.";
            lblSuccessDesc.Font = new Font("Segoe UI", 9.5f);
            lblSuccessDesc.ForeColor = Color.FromArgb(203, 213, 225);
            lblSuccessDesc.Location = new Point(12, 60);
            lblSuccessDesc.Size = new Size(550, 100);

            chkLaunchApp = new CheckBox();
            chkLaunchApp.Text = "Ejecutar RDL Intelligence Hub ahora al salir";
            chkLaunchApp.Checked = true;
            chkLaunchApp.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            chkLaunchApp.ForeColor = Color.FromArgb(0, 230, 118);
            chkLaunchApp.Location = new Point(12, 170);
            chkLaunchApp.AutoSize = true;

            panelStep4.Controls.Add(lblSuccess);
            panelStep4.Controls.Add(lblSuccessDesc);
            panelStep4.Controls.Add(chkLaunchApp);

            // BOTONES DE NAVEGACIÓN
            btnBack = new Button();
            btnBack.Text = "< Atrás";
            btnBack.Location = new Point(320, 380);
            btnBack.Size = new Size(85, 32);
            btnBack.FlatStyle = FlatStyle.Flat;
            btnBack.BackColor = Color.FromArgb(30, 41, 59);
            btnBack.ForeColor = Color.White;
            btnBack.Enabled = false;
            btnBack.Click += BtnBack_Click;

            btnNext = new Button();
            btnNext.Text = "Siguiente >";
            btnNext.Location = new Point(415, 380);
            btnNext.Size = new Size(95, 32);
            btnNext.FlatStyle = FlatStyle.Flat;
            btnNext.BackColor = Color.FromArgb(16, 185, 129);
            btnNext.ForeColor = Color.White;
            btnNext.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnNext.Click += BtnNext_Click;

            btnCancel = new Button();
            btnCancel.Text = "Cancelar";
            btnCancel.Location = new Point(518, 380);
            btnCancel.Size = new Size(80, 32);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            btnCancel.ForeColor = Color.White;
            btnCancel.Click += (s, e) => this.Close();

            this.Controls.Add(panelHeader);
            this.Controls.Add(panelStep1);
            this.Controls.Add(panelStep2);
            this.Controls.Add(panelStep3);
            this.Controls.Add(panelStep4);
            this.Controls.Add(btnBack);
            this.Controls.Add(btnNext);
            this.Controls.Add(btnCancel);

            bgWorker = new BackgroundWorker();
            bgWorker.DoWork += BgWorker_DoWork;
            bgWorker.RunWorkerCompleted += BgWorker_RunWorkerCompleted;
        }

        private void BtnBrowse_Click(object sender, EventArgs e) {
            using (FolderBrowserDialog fbd = new FolderBrowserDialog()) {
                fbd.Description = "Selecciona la carpeta donde deseas instalar RDL Intelligence Hub:";
                fbd.SelectedPath = txtInstallDir.Text;
                if (fbd.ShowDialog() == DialogResult.OK) {
                    txtInstallDir.Text = fbd.SelectedPath;
                }
            }
        }

        private void BtnNext_Click(object sender, EventArgs e) {
            if (currentStep == 1) {
                currentStep = 2;
                panelStep1.Visible = false;
                panelStep2.Visible = true;
                btnBack.Enabled = true;
                btnNext.Text = "Instalar >";
            } else if (currentStep == 2) {
                finalInstallDir = txtInstallDir.Text.Trim();
                if (string.IsNullOrEmpty(finalInstallDir)) {
                    MessageBox.Show("Por favor ingresa o selecciona un directorio de instalacion valido.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                currentStep = 3;
                panelStep2.Visible = false;
                panelStep3.Visible = true;
                btnBack.Enabled = false;
                btnNext.Enabled = false;
                btnCancel.Enabled = false;

                bgWorker.RunWorkerAsync();
            } else if (currentStep == 4) {
                if (chkLaunchApp.Checked) {
                    string batLauncher = Path.Combine(finalInstallDir, "Iniciar RDL Intelligence Hub.bat");
                    if (File.Exists(batLauncher)) {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = batLauncher;
                        psi.WorkingDirectory = finalInstallDir;
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                    }
                }
                this.Close();
            }
        }

        private void BtnBack_Click(object sender, EventArgs e) {
            if (currentStep == 2) {
                currentStep = 1;
                panelStep2.Visible = false;
                panelStep1.Visible = true;
                btnBack.Enabled = false;
                btnNext.Text = "Siguiente >";
            }
        }

        private void BgWorker_DoWork(object sender, DoWorkEventArgs e) {
            try {
                if (!Directory.Exists(finalInstallDir)) {
                    Directory.CreateDirectory(finalInstallDir);
                }

                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("rdl_payload.zip")) {
                    if (stream != null) {
                        using (ZipArchive archive = new ZipArchive(stream)) {
                            foreach (ZipArchiveEntry entry in archive.Entries) {
                                string destinationPath = Path.Combine(finalInstallDir, entry.FullName);
                                string dirPath = Path.GetDirectoryName(destinationPath);
                                
                                if (!string.IsNullOrEmpty(dirPath) && !Directory.Exists(dirPath)) {
                                    Directory.CreateDirectory(dirPath);
                                }
                                if (!string.IsNullOrEmpty(entry.Name)) {
                                    entry.ExtractToFile(destinationPath, true);
                                }
                            }
                        }
                    } else {
                        throw new Exception("No se encontró el recurso rdl_payload.zip en el instalador.");
                    }
                }

                if (chkCreateShortcut.Checked) {
                    string batLauncher = Path.Combine(finalInstallDir, "Iniciar RDL Intelligence Hub.bat");
                    string logoIco = Path.Combine(finalInstallDir, "Logo RDL.ico");
                    string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    string shortcutPath = Path.Combine(desktopDir, "RDL Intelligence Hub.lnk");

                    CreateShortcut(shortcutPath, batLauncher, finalInstallDir, logoIco);
                }
            } catch (Exception ex) {
                e.Result = ex.Message;
            }
        }

        private void BgWorker_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e) {
            if (e.Result != null) {
                MessageBox.Show("Error durante la instalacion: " + e.Result.ToString(), "Error de Instalacion", MessageBoxButtons.OK, MessageBoxIcon.Error);
                this.Close();
                return;
            }

            currentStep = 4;
            panelStep3.Visible = false;
            panelStep4.Visible = true;
            btnNext.Enabled = true;
            btnNext.Text = "Finalizar";
            btnCancel.Enabled = false;
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string workDir, string iconPath) {
            try {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = workDir;
                shortcut.IconLocation = iconPath;
                shortcut.Description = "RDL Intelligence Hub - Plataforma Corporativa";
                shortcut.Save();
            } catch {}
        }
    }
}
`;

fs.writeFileSync(csharpFile, csharpSource);

// 4. Compilar con csc.exe /target:winexe (Sin ventana de consola CMD)
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (fs.existsSync(targetExe)) {
    try { fs.unlinkSync(targetExe); } catch {}
}

console.log('⚙️ Compilando ejecutable gráfico (.exe sin consola CMD) con csc.exe /target:winexe...');
const cscCmd = `"${cscPath}" /target:winexe /out:"${targetExe}" /res:"${tempZip}",rdl_payload.zip /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "${csharpFile}"`;
execSync(cscCmd, { cwd: outputInstallerDir });

// Copiar al Escritorio
try {
    if (fs.existsSync(desktopExe)) fs.unlinkSync(desktopExe);
    fs.copyFileSync(targetExe, desktopExe);
} catch (e) {
    console.log('Nota: El ejecutable fue creado en OutputInstaller/RDL_Intelligence_Hub_Setup.exe');
}

const stat = fs.statSync(targetExe);

console.log('\n========================================================================');
console.log(`✅ ¡ASISTENTE GRÁFICO (GUI WIZARD) .EXE CREADO CON ÉXITO!`);
console.log(`   -> ${targetExe}`);
console.log(`   Tamaño del Instalador GUI: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log('========================================================================\n');

// Limpieza
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
if (fs.existsSync(csharpFile)) fs.unlinkSync(csharpFile);
