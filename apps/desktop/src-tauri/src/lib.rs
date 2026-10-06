use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct TradeSignalCommand {
    pub signal_id: String,
    pub symbol: String,
    pub direction: String,
    pub decision: String, // "APPROVE" | "REJECT"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiCredentials {
    pub api_key: String,
    pub api_secret: String,
}

// ---------------------------------------------------------------------------
// Native IPC Commands Exposed to Frontend React/Next.js Layer
// ---------------------------------------------------------------------------

/// Securely stores exchange API secrets in OS Keychain / Credential Manager
#[tauri::command]
pub async fn save_secure_credentials(service: String, credentials: ApiCredentials) -> Result<String, String> {
    let entry_key = format!("{}_api_key", service);
    let entry_secret = format!("{}_api_secret", service);

    let kr_key = keyring::Entry::new("QuantumTrader", &entry_key).map_err(|e| e.to_string())?;
    let kr_secret = keyring::Entry::new("QuantumTrader", &entry_secret).map_err(|e| e.to_string())?;

    kr_key.set_password(&credentials.api_key).map_err(|e| e.to_string())?;
    kr_secret.set_password(&credentials.api_secret).map_err(|e| e.to_string())?;

    Ok("Credentials saved securely in system vault.".to_string())
}

/// Retrieves stored API keys from OS Keychain
#[tauri::command]
pub async fn get_secure_credentials(service: String) -> Result<ApiCredentials, String> {
    let entry_key = format!("{}_api_key", service);
    let entry_secret = format!("{}_api_secret", service);

    let kr_key = keyring::Entry::new("QuantumTrader", &entry_key).map_err(|e| e.to_string())?;
    let kr_secret = keyring::Entry::new("QuantumTrader", &entry_secret).map_err(|e| e.to_string())?;

    let api_key = kr_key.get_password().map_err(|e| e.to_string())?;
    let api_secret = kr_secret.get_password().map_err(|e| e.to_string())?;

    Ok(ApiCredentials { api_key, api_secret })
}

/// Triggers OS Native Desktop Banner Notification for High Confluence Signals
#[tauri::command]
pub async fn send_desktop_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Executes or rejects a trade signal directly via Rust HTTP layer for lower latency
#[tauri::command]
pub async fn execute_signal_command(command: TradeSignalCommand) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("http://localhost:8000/api/v1/signals/decision")
        .json(&command)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(format!("Signal {} marked as {}", command.signal_id, command.decision))
    } else {
        Err(format!("Execution failed with status: {}", res.status()))
    }
}

// ---------------------------------------------------------------------------
// Tauri App Core Entry Point & Lifecycle Builder
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::AppleScript,
            Some(vec!["--autostart"]),
        ))
        .invoke_handler(tauri::generate_handler![
            save_secure_credentials,
            get_secure_credentials,
            send_desktop_notification,
            execute_signal_command
        ])
        .setup(|app| {
            // Build Native System Tray Controls
            let quit_i = MenuItem::with_id(app, "quit", "Quit Quantum", true, None::<&str>)?;
            let toggle_i = MenuItem::with_id(app, "toggle", "Show/Hide Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running quantum desktop application");
}
