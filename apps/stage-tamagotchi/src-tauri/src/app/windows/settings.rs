use std::{path::Path, sync::Arc};

use anyhow::{Ok, Result};
#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri::{Manager, Runtime, WebviewUrl, WebviewWindowBuilder, webview::PageLoadPayload};

pub fn new_settings_window<R: Runtime>(
  app: &tauri::AppHandle<R>,
  page_load_handler: Option<Arc<dyn Fn(tauri::WebviewWindow<R>, PageLoadPayload) + Send + Sync>>,
) -> Result<tauri::WebviewWindow<R>> {
  if let Some(window) = app.get_webview_window("settings") {
    _ = window.show();
    _ = window.set_focus();
    return Ok(window);
  }

  let mut builder = WebviewWindowBuilder::new(
    app,
    "settings",
    WebviewUrl::App(Path::new("#/settings").to_path_buf()),
  )
  .title("Settings")
  .inner_size(550.0, 900.0)
  .min_inner_size(550.0, 900.0)
  .shadow(true)
  .transparent(false)
  .accept_first_mouse(true);

  if let Some(handler) = page_load_handler {
    builder = builder.on_page_load(move |window, load| {
      handler(window, load);
    });
  }

  #[cfg(target_os = "macos")]
  {
    // macOS traffic light (red, yellow, green) position customization
    //
    // feat: traffic light position (#12366) · tauri-apps/tauri@30f5a15
    // https://github.com/tauri-apps/tauri/commit/30f5a1553d3c0ce460c9006764200a9210915a44
    builder = builder.hidden_title(true);
    builder = builder.decorations(true);
    builder = builder.title_bar_style(TitleBarStyle::Overlay);
    builder = builder.traffic_light_position(tauri::LogicalPosition::new(14.0, 20.0));
  }

  let window = builder.build()?;

  Ok(window)
}
