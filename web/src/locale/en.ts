import { localeInterface } from "./localeInterface";

const locale_en: localeInterface = {
  locale: "en",
  frontpage: {
    welcome: "Welcome to Broadcast Box",
    welcome_subtitle:
      "Broadcast Box is a tool that allows you to efficiently stream high-quality video in real time, using the latest in video codecs and WebRTC technology.",

    toggle_watch: "I want to watch",
    toggle_stream: "I want to stream",

    stream_input_label: "Stream key",
    stream_input_placeholder_share: "Insert the key of the stream you want to share",
    stream_input_placeholder_join: "Insert the key of the stream you want to join",

    stream_button_stream_start: "Start stream",
    stream_button_stream_join: "Join stream",
  },

  available_streams: {
    title: "Current streams",
    stream_join_message: "Click a stream to join it",
    no_streams_message: "No streams currently available",
  },

  statistics: {
    title: "Statistics",
    no_statistics_available: "No statistics currently available",
    no_sessions: "No sessions available",

    whep_sessions: "WHEP Sessions",

    video: "Video",
    video_tracks: "Video tracks",
    video_track_not_available: "No video tracks",
    video_bitrate: "Bitrate",
    video_bitrate_total_out: "Bitrate outgoing",

    audio: "Audio",
    audio_tracks: "Audio tracks",
    audio_track_not_available: "No audio tracks",

    button_watch_stream: "Watch stream",

    rid: "RID",
    layer: "Layers",
    packets_received: "Packets received",
    packets_dropped: "Packets dropped",
    packets_written: "Packets written",
    last_key_frame: "Last key frame",
    timestamp: "Timestamp",
    sequence_number: "Seq. number",
  },

  player_header: {
    error: "Error",
    success: "Success",
    warning: "Warning",

    mediaAccessError_default: "Could not access your media devices",
    mediaAccessError_noMediaDevices:
      "MediaDevices API was not found. Publishing in Broadcast Box requires HTTPS",
    mediaAccessError_notAllowedError:
      "You can't publish stream using your camera, access has been disabled.",
    mediaAccessError_notFoundError:
      "Seems like you don't have camera. Or the access to it is blocked\nCheck camera settings, browser permissions and system permissions.",

    connection_established: "Live: Currently streaming to",
    connection_disconnected: "WebRTC has disconnected or failed to connect at all",
    connection_failed: "Failed to start Broadcast Box session",
    connection_has_packetloss: "WebRTC is experiencing packet loss",

    publish_screen: "Publish Screen/Window/Tab",
    publish_webcam: "Publish Webcam",

    button_end_stream: "End stream",
  },

  player_page: {
    cinema_mode_enable: "Enable cinema mode",
    cinema_mode_disable: "Disable cinema mode",

    modal_add_stream_title: "Add stream",
    modal_add_stream_message: "Insert stream key to add to multi stream",
    modal_add_stream_placeholder: "Insert the key of the stream you want to add",
    modal_add_stream_already_added: "That stream is already on this page",
  },

  player: {
    message_is_not_online: "is not currently streaming",
    message_offline_hint: "Playback starts automatically when the stream goes live.",
    message_loading_video: "Loading video",
    message_reconnecting: "Connection lost. Reconnecting…",
    message_rejected: "You are not allowed to watch this stream.",
    button_retry: "Retry now",

    status_live: "Live",
    stream_status_offline: "Offline",

    button_play: "Play",
    button_pause: "Pause",
    button_mute: "Mute",
    button_unmute: "Unmute",
    button_tap_to_unmute: "Tap to unmute",
    volume_label: "Volume",
    button_fullscreen_enter: "Fullscreen",
    button_fullscreen_exit: "Exit fullscreen",
    button_picture_in_picture: "Picture-in-picture",
    button_show_chat: "Show chat",
    button_hide_chat: "Hide chat",
    button_close_stream: "Close stream",

    menu_quality: "Quality",
    menu_audio_track: "Audio track",
    menu_option_auto: "Auto",
  },

  stream_status: {
    message_current_viewers: "Current Viewers",
  },

  profile_settings: {
    title: "Profile Settings",
    subTitle: "Configure streaming profile",

    toggle_stream_privacy_label: "Privacy",
    toggle_stream_privacy_title_left: "Private",
    toggle_stream_privacy_title_right: "Public",

    input_motd_label: "Message of the Day",
    button_save_label: "Save",
  },

  admin_login: {
    login_input_dialog_title: "Login",
    login_input_dialog_message: "Insert admin token to log in",
    login_input_dialog_placeholder: "Insert admin token to log in",
    error_message_login_failed: "Login failed",

    button_login_text: "Login",
  },

  admin_page: {
    title: "Admin Portal",
    menu_api: "API",
    menu_logging: "Logging",
    menu_logout: "Logout",
    menu_profiles: "Profiles",
    menu_settings: "Settings",
    menu_status: "Status",
  },

  admin_page_api: {
    title: "API Settings",
    table_header_setting_name: "Setting",
    table_header_value: "Value",
  },

  admin_page_logging: {
    title: "Logging",
    table_header_setting_name: "Setting",
    table_header_value: "Value",
  },

  admin_page_profiles: {
    title: "Profiles Overview",

    add_profile_modal_title: "Add Profile",
    add_profile_modal_message: "Insert a key to add a new stream",
    add_profile_modal_placeholder: "Write new stream key here",

    remove_profile_modal_title: "Remove Profile",
    remove_profile_modal_message: "Are you sure you would like to remove",

    table_header_stream_key: "Stream Key",
    table_header_is_public: "Is Public",
    table_header_motd: "Motd",
    table_header_token: "Token",

    button_add_profile: "Add profile",

    yes: "Yes",
    no: "No",
  },

  admin_page_status_page: {
    title: "Stream Status Overview",

    table_header_stream_key: "Stream Key",
    table_header_is_public: "Is Public",
    table_header_video_tracks: "Video Tracks",
    table_header_audio_tracks: "Audio Tracks",
    table_header_sessions: "Sessions",
    table_header_total_packets: "Total Packets",

    yes: "yes",
    no: "no",
  },

  shared_component_card: {
    button_accept: "Accept",
  },
  shared_component_text_input_modal: {
    button_accept: "Accept",
    button_close: "Close",
  },
  shared_component_text_input_dialog: {
    button_accept: "Accept",
  },

  chat: {
    title: "Chat",
    tab_stream_chat: "Stream chat",
    tab_twitch: "Twitch",
    stream_picker_label: "Chat for stream",
    button_close_panel: "Close panel",
    unread_messages: "unread messages",

    placeholder_input: "Write a message",
    button_reaction_title: "Send reaction",
    button_send_title: "Send message",
    button_new_messages: "New messages",
    no_messages_yet: "No chat messages yet.",

    status_connecting: "Connecting to chat…",
    status_disconnected: "Chat is disconnected",
    error_not_connected: "Chat is not connected",
    error_failed_to_send: "Failed to send message",

    display_name_prompt: "Choose a display name to start chatting",
    display_name_label: "Display name",
    display_name_placeholder: "Enter display name",
    chatting_as: "Chatting as",
    button_change_display_name_title: "Change display name",
    button_save_display_name: "Save",
    button_cancel: "Cancel",
  },

  twitch: {
    channel_label: "Twitch channel",
    channel_placeholder: "Channel name or twitch.tv link",
    channel_help:
      "Show a Twitch channel’s chat next to this stream. Your choice is saved in this browser for this stream.",
    error_invalid_channel: "Enter a valid Twitch channel name or link.",
    button_open_chat: "Open chat",
    button_change_channel: "Change channel",
    button_open_popout: "Open in new window",
    embed_requires_https: "Twitch only allows its chat to be embedded on sites served over HTTPS.",
    embed_requires_domain:
      "Twitch does not allow its chat to be embedded on sites opened by IP address.",
    embed_fallback: "You can still open the chat in a separate window.",
    iframe_title: "Twitch chat",
  },

  site: {
    skip_to_content: "Skip to content",
    language_label: "Language",
  },
};
export default locale_en;
