use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub version: String,
    pub theme: ThemeSettings,
    pub calendar: CalendarSettings,
    pub notifications: NotificationSettings,
    pub sync: SyncSettings,
    pub shortcuts: ShortcutSettings,
    pub appearance: AppearanceSettings,
    pub privacy: PrivacySettings,
    pub advanced: AdvancedSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSettings {
    pub mode: String,
    pub active_theme: String,
    pub custom: CustomTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomTheme {
    pub name: String,
    pub colors: ThemeColors,
    pub typography: Typography,
    pub spacing: Spacing,
    pub border_radius: BorderRadius,
    pub shadows: Shadows,
    pub animations: Animations,
    pub effects: Effects,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeColors {
    pub background: String,
    pub foreground: String,
    pub primary: String,
    pub primary_hover: String,
    pub accent: String,
    pub accent_hover: String,
    pub muted: String,
    pub muted_hover: String,
    pub border: String,
    pub sidebar: String,
    pub hover: String,
    pub success: String,
    pub warning: String,
    pub error: String,
    pub info: String,
    pub event: EventColors,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventColors {
    pub work: String,
    pub personal: String,
    pub meeting: String,
    pub focus: String,
    pub default: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Typography {
    pub font_family: String,
    pub font_size: FontSizes,
    pub font_weight: FontWeights,
    pub line_height: LineHeights,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontSizes {
    pub xs: u32,
    pub sm: u32,
    pub base: u32,
    pub lg: u32,
    pub xl: u32,
    #[serde(rename = "2xl")]
    pub xxl: u32,
    #[serde(rename = "3xl")]
    pub xxxl: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontWeights {
    pub normal: u32,
    pub medium: u32,
    pub semibold: u32,
    pub bold: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineHeights {
    pub tight: f32,
    pub normal: f32,
    pub relaxed: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Spacing {
    pub event_padding: u32,
    pub event_margin: u32,
    pub grid_gap: u32,
    pub sidebar_width: u32,
    pub calendar_padding: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorderRadius {
    pub sm: u32,
    pub md: u32,
    pub lg: u32,
    pub xl: u32,
    pub full: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shadows {
    pub sm: String,
    pub md: String,
    pub lg: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animations {
    pub enabled: bool,
    pub duration: AnimationDurations,
    pub easing: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationDurations {
    pub fast: u32,
    pub normal: u32,
    pub slow: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Effects {
    pub blur_enabled: bool,
    pub blur_amount: u32,
    pub transparency: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarSettings {
    pub start_of_week: String,
    pub default_view: String,
    pub time_format: String,
    pub date_format: String,
    pub time_zone: String,
    pub show_week_numbers: bool,
    pub show_declined_events: bool,
    pub default_event_duration: u32,
    pub working_hours: WorkingHours,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkingHours {
    pub enabled: bool,
    pub start: String,
    pub end: String,
    pub days: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSettings {
    pub enabled: bool,
    pub default_reminders: Vec<i32>,
    pub sound_enabled: bool,
    pub sound_name: String,
    pub silent_hours: SilentHours,
    pub show_event_details: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SilentHours {
    pub enabled: bool,
    pub start: String,
    pub end: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSettings {
    pub auto_sync: bool,
    pub sync_interval: u32,
    pub conflict_resolution: String,
    pub sync_on_startup: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutSettings {
    pub shortcuts: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub font_size: u32,
    pub density: String,
    pub reduce_motion: bool,
    pub high_contrast: bool,
    pub show_sidebar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacySettings {
    pub analytics_enabled: bool,
    pub crash_reports_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvancedSettings {
    pub developer_mode: bool,
    pub log_level: String,
    pub cache_size: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            theme: ThemeSettings::default(),
            calendar: CalendarSettings::default(),
            notifications: NotificationSettings::default(),
            sync: SyncSettings::default(),
            shortcuts: ShortcutSettings::default(),
            appearance: AppearanceSettings::default(),
            privacy: PrivacySettings::default(),
            advanced: AdvancedSettings::default(),
        }
    }
}

impl Default for ThemeSettings {
    fn default() -> Self {
        Self {
            mode: "dark".to_string(),
            active_theme: "midnight".to_string(),
            custom: CustomTheme::default(),
        }
    }
}

impl Default for CustomTheme {
    fn default() -> Self {
        Self {
            name: "Custom".to_string(),
            colors: ThemeColors::default(),
            typography: Typography::default(),
            spacing: Spacing::default(),
            border_radius: BorderRadius::default(),
            shadows: Shadows::default(),
            animations: Animations::default(),
            effects: Effects::default(),
        }
    }
}

impl Default for ThemeColors {
    fn default() -> Self {
        Self {
            background: "#1e1e2e".to_string(),
            foreground: "#cdd6f4".to_string(),
            primary: "#89b4fa".to_string(),
            primary_hover: "#7ba4ea".to_string(),
            accent: "#f38ba8".to_string(),
            accent_hover: "#e37b98".to_string(),
            muted: "#313244".to_string(),
            muted_hover: "#414354".to_string(),
            border: "#45475a".to_string(),
            sidebar: "#181825".to_string(),
            hover: "#313244".to_string(),
            success: "#a6e3a1".to_string(),
            warning: "#f9e2af".to_string(),
            error: "#f38ba8".to_string(),
            info: "#89dceb".to_string(),
            event: EventColors::default(),
        }
    }
}

impl Default for EventColors {
    fn default() -> Self {
        Self {
            work: "#89b4fa".to_string(),
            personal: "#a6e3a1".to_string(),
            meeting: "#f9e2af".to_string(),
            focus: "#cba6f7".to_string(),
            default: "#6c7086".to_string(),
        }
    }
}

impl Default for Typography {
    fn default() -> Self {
        Self {
            font_family: "Inter, system-ui, sans-serif".to_string(),
            font_size: FontSizes::default(),
            font_weight: FontWeights::default(),
            line_height: LineHeights::default(),
        }
    }
}

impl Default for FontSizes {
    fn default() -> Self {
        Self {
            xs: 11,
            sm: 12,
            base: 14,
            lg: 16,
            xl: 20,
            xxl: 24,
            xxxl: 30,
        }
    }
}

impl Default for FontWeights {
    fn default() -> Self {
        Self {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        }
    }
}

impl Default for LineHeights {
    fn default() -> Self {
        Self {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
        }
    }
}

impl Default for Spacing {
    fn default() -> Self {
        Self {
            event_padding: 8,
            event_margin: 2,
            grid_gap: 1,
            sidebar_width: 280,
            calendar_padding: 16,
        }
    }
}

impl Default for BorderRadius {
    fn default() -> Self {
        Self {
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            full: 9999,
        }
    }
}

impl Default for Shadows {
    fn default() -> Self {
        Self {
            sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)".to_string(),
            md: "0 4px 6px -1px rgb(0 0 0 / 0.1)".to_string(),
            lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)".to_string(),
        }
    }
}

impl Default for Animations {
    fn default() -> Self {
        Self {
            enabled: true,
            duration: AnimationDurations::default(),
            easing: "cubic-bezier(0.4, 0, 0.2, 1)".to_string(),
        }
    }
}

impl Default for AnimationDurations {
    fn default() -> Self {
        Self {
            fast: 100,
            normal: 200,
            slow: 300,
        }
    }
}

impl Default for Effects {
    fn default() -> Self {
        Self {
            blur_enabled: true,
            blur_amount: 10,
            transparency: 0.95,
        }
    }
}

impl Default for CalendarSettings {
    fn default() -> Self {
        Self {
            start_of_week: "monday".to_string(),
            default_view: "week".to_string(),
            time_format: "12h".to_string(),
            date_format: "MMM d, yyyy".to_string(),
            time_zone: "auto".to_string(),
            show_week_numbers: false,
            show_declined_events: false,
            default_event_duration: 60,
            working_hours: WorkingHours::default(),
        }
    }
}

impl Default for WorkingHours {
    fn default() -> Self {
        Self {
            enabled: true,
            start: "09:00".to_string(),
            end: "17:00".to_string(),
            days: vec![1, 2, 3, 4, 5],
        }
    }
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            default_reminders: vec![15, 5],
            sound_enabled: true,
            sound_name: "default".to_string(),
            silent_hours: SilentHours::default(),
            show_event_details: true,
        }
    }
}

impl Default for SilentHours {
    fn default() -> Self {
        Self {
            enabled: false,
            start: "22:00".to_string(),
            end: "08:00".to_string(),
        }
    }
}

impl Default for SyncSettings {
    fn default() -> Self {
        Self {
            auto_sync: true,
            sync_interval: 300,
            conflict_resolution: "remote_wins".to_string(),
            sync_on_startup: true,
        }
    }
}

impl Default for ShortcutSettings {
    fn default() -> Self {
        let mut shortcuts = HashMap::new();
        shortcuts.insert("newEvent".to_string(), "CommandOrControl+N".to_string());
        shortcuts.insert(
            "commandPalette".to_string(),
            "CommandOrControl+K".to_string(),
        );
        shortcuts.insert("today".to_string(), "CommandOrControl+T".to_string());
        shortcuts.insert("refresh".to_string(), "CommandOrControl+R".to_string());
        shortcuts.insert("settings".to_string(), "CommandOrControl+,".to_string());
        shortcuts.insert(
            "toggleSidebar".to_string(),
            "CommandOrControl+B".to_string(),
        );
        shortcuts.insert("search".to_string(), "/".to_string());
        shortcuts.insert(
            "previousView".to_string(),
            "CommandOrControl+Left".to_string(),
        );
        shortcuts.insert("nextView".to_string(), "CommandOrControl+Right".to_string());
        shortcuts.insert("dayView".to_string(), "D".to_string());
        shortcuts.insert("weekView".to_string(), "W".to_string());
        shortcuts.insert("monthView".to_string(), "M".to_string());
        shortcuts.insert("yearView".to_string(), "Y".to_string());
        shortcuts.insert("agendaView".to_string(), "A".to_string());
        Self { shortcuts }
    }
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            font_size: 14,
            density: "comfortable".to_string(),
            reduce_motion: false,
            high_contrast: false,
            show_sidebar: true,
        }
    }
}

impl Default for PrivacySettings {
    fn default() -> Self {
        Self {
            analytics_enabled: false,
            crash_reports_enabled: true,
        }
    }
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            developer_mode: false,
            log_level: "info".to_string(),
            cache_size: 100,
        }
    }
}
