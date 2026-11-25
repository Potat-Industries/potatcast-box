import { localeInterface } from "./localeInterface";

const locale_da: localeInterface = {
  locale: "da",
  frontpage: {
    welcome: "Velkommen til Broadcast Box",
    welcome_subtitle:
      "Broadcast Box er et værktøj, der gør det muligt at streame video i høj kvalitet i realtid ved hjælp af de nyeste video-codecs og WebRTC-teknologi.",

    toggle_watch: "Jeg vil se",
    toggle_stream: "Jeg vil streame",

    stream_input_label: "Stream-nøgle",
    stream_input_placeholder_share: "Indsæt nøglen til det stream, du vil dele",
    stream_input_placeholder_join: "Indsæt nøglen til det stream, du vil deltage i",

    stream_button_stream_start: "Start stream",
    stream_button_stream_join: "Deltag i stream",
  },

  available_streams: {
    title: "Aktuelle streams",
    stream_join_message: "Klik på et stream for at deltage",
    no_streams_message: "Ingen streams tilgængelige i øjeblikket",
  },

  statistics: {
    title: "Statistik",
    no_statistics_available: "Ingen statistik tilgængelig i øjeblikket",
    no_sessions: "Ingen sessioner tilgængelige",

    whep_sessions: "WHEP-sessioner",

    video: "Video",
    video_tracks: "Videospor",
    video_track_not_available: "Ingen videospor",
    video_bitrate: "Bitrate",
    video_bitrate_total_out: "Bitrate ud",

    audio: "Lyd",
    audio_tracks: "Lydspor",
    audio_track_not_available: "Ingen lydspor",

    button_watch_stream: "Se stream",

    rid: "RID",
    layer: "Lag",
    packets_received: "Modtagne pakker",
    packets_dropped: "Tabte pakker",
    packets_written: "Sendte pakker",
    last_key_frame: "Sidste nøglebillede",
    timestamp: "Tidsstempel",
    sequence_number: "Sekvensnummer",
  },

  player_header: {
    error: "Fejl",
    success: "Succes",
    warning: "Advarsel",

    mediaAccessError_default: "Kunne ikke få adgang til dine medieenheder",
    mediaAccessError_noMediaDevices:
      "MediaDevices API blev ikke fundet. Udgivelse i Broadcast Box kræver HTTPS",
    mediaAccessError_notAllowedError:
      "Du kan ikke streame med dit kamera, adgangen er blevet deaktiveret.",
    mediaAccessError_notFoundError:
      "Det ser ud til, at du ikke har et kamera, eller at adgangen er blokeret\nTjek kameraindstillinger, browser- og systemtilladelser.",

    connection_established: "Live: Streamer i øjeblikket til",
    connection_disconnected: "WebRTC er afbrudt eller kunne ikke oprette forbindelse",
    connection_failed: "Kunne ikke starte Broadcast Box-session",
    connection_has_packetloss: "WebRTC oplever pakketab",

    publish_screen: "Del skærm/vindue/faneblad",
    publish_webcam: "Del webcam",

    button_end_stream: "Afslut stream",
  },

  player_page: {
    cinema_mode_enable: "Aktiver biotilstand",
    cinema_mode_disable: "Deaktiver biotilstand",

    modal_add_stream_title: "Tilføj stream",
    modal_add_stream_message: "Indsæt stream-nøgle for at tilføje til multi-stream",
    modal_add_stream_placeholder: "Indsæt nøglen til den stream, du vil tilføje",
    modal_add_stream_already_added: "Den stream er allerede på denne side",
  },

  player: {
    message_is_not_online: "streamer ikke i øjeblikket",
    message_offline_hint: "Afspilningen starter automatisk, når streamen går live.",
    message_loading_video: "Indlæser video",
    message_reconnecting: "Forbindelsen blev afbrudt. Forbinder igen…",
    message_rejected: "Du har ikke adgang til at se denne stream.",
    button_retry: "Prøv igen nu",

    status_live: "Live",
    stream_status_offline: "Offline",

    button_play: "Afspil",
    button_pause: "Pause",
    button_mute: "Slå lyd fra",
    button_unmute: "Slå lyd til",
    button_tap_to_unmute: "Tryk for at slå lyd til",
    volume_label: "Lydstyrke",
    button_fullscreen_enter: "Fuld skærm",
    button_fullscreen_exit: "Afslut fuld skærm",
    button_picture_in_picture: "Billede i billede",
    button_show_chat: "Vis chat",
    button_hide_chat: "Skjul chat",
    button_close_stream: "Luk stream",

    menu_quality: "Kvalitet",
    menu_audio_track: "Lydspor",
    menu_option_auto: "Auto",
  },

  stream_status: {
    message_current_viewers: "Nuværende seere",
  },

  profile_settings: {
    title: "Profilindstillinger",
    subTitle: "Konfigurer streamingprofil",

    toggle_stream_privacy_label: "Privatliv",
    toggle_stream_privacy_title_left: "Privat",
    toggle_stream_privacy_title_right: "Offentlig",

    input_motd_label: "Dagens besked",
    button_save_label: "Gem",
  },

  admin_login: {
    login_input_dialog_title: "Login",
    login_input_dialog_message: "Indsæt admin-token for at logge ind",
    login_input_dialog_placeholder: "Indsæt admin-token for at logge ind",
    error_message_login_failed: "Login mislykkedes",
    error_message_invalid_token: "Admin-tokenet blev ikke accepteret.",
    error_message_server_unreachable: "Kunne ikke få forbindelse til serveren. Prøv igen om lidt.",
    button_login_text: "Login",
  },

  admin_page: {
    title: "Adminportal",
    menu_api: "API",
    menu_logging: "Logning",
    menu_logout: "Log ud",
    menu_profiles: "Profiler",
    menu_settings: "Indstillinger",
    menu_status: "Status",
  },

  admin_page_api: {
    title: "API-indstillinger",
    table_header_setting_name: "Indstilling",
    table_header_value: "Værdi",
  },

  admin_page_logging: {
    title: "Logning",
    table_header_setting_name: "Indstilling",
    table_header_value: "Værdi",
  },

  admin_page_profiles: {
    title: "Profiloversigt",

    add_profile_modal_title: "Tilføj profil",
    add_profile_modal_message: "Indsæt en nøgle for at tilføje en ny stream",
    add_profile_modal_placeholder: "Skriv ny stream-nøgle her",

    remove_profile_modal_title: "Fjern profil",
    remove_profile_modal_message: "Er du sikker på, at du vil fjerne",

    table_header_stream_key: "Stream-nøgle",
    table_header_is_public: "Er offentlig",
    table_header_motd: "Motd",
    table_header_token: "Token",

    button_add_profile: "Tilføj profil",

    yes: "Ja",
    no: "Nej",
  },

  admin_page_status_page: {
    title: "Stream-statusoversigt",

    table_header_stream_key: "Stream-nøgle",
    table_header_is_public: "Er offentlig",
    table_header_video_tracks: "Videospor",
    table_header_audio_tracks: "Lydspor",
    table_header_sessions: "Sessioner",
    table_header_total_packets: "Samlede pakker",

    yes: "ja",
    no: "nej",
  },

  shared_component_card: {
    button_accept: "Acceptér",
  },
  shared_component_text_input_modal: {
    button_accept: "Acceptér",
    button_close: "Luk",
  },
  shared_component_text_input_dialog: {
    button_accept: "Acceptér",
  },

  chat: {
    title: "Chat",
    tab_stream_chat: "Stream-chat",
    tab_twitch: "Twitch",
    stream_picker_label: "Chat for stream",
    button_close_panel: "Luk panel",
    unread_messages: "ulæste beskeder",

    placeholder_input: "Skriv en besked",
    button_reaction_title: "Send reaktion",
    button_send_title: "Send besked",
    button_new_messages: "Nye beskeder",
    no_messages_yet: "Ingen chatbeskeder endnu.",

    status_connecting: "Forbinder til chat…",
    status_disconnected: "Chatten er afbrudt",
    error_not_connected: "Chat er ikke forbundet",
    error_failed_to_send: "Kunne ikke sende besked",

    display_name_prompt: "Vælg et visningsnavn for at begynde at chatte",
    display_name_label: "Visningsnavn",
    display_name_placeholder: "Indtast visningsnavn",
    chatting_as: "Chatter som",
    button_change_display_name_title: "Skift visningsnavn",
    button_save_display_name: "Gem",
    button_cancel: "Annuller",
  },

  twitch: {
    channel_label: "Twitch-kanal",
    channel_placeholder: "Kanalnavn eller twitch.tv-link",
    channel_help:
      "Vis en Twitch-kanals chat ved siden af denne stream. Dit valg gemmes i denne browser for denne stream.",
    error_invalid_channel: "Indtast et gyldigt Twitch-kanalnavn eller -link.",
    button_open_chat: "Åbn chat",
    button_change_channel: "Skift kanal",
    button_open_popout: "Åbn i nyt vindue",
    embed_requires_https: "Twitch tillader kun, at chatten indlejres på sider, der bruger HTTPS.",
    embed_requires_domain:
      "Twitch tillader ikke, at chatten indlejres på sider, der åbnes via en IP-adresse.",
    embed_fallback: "Du kan stadig åbne chatten i et separat vindue.",
    iframe_title: "Twitch-chat",
  },

  site: {
    skip_to_content: "Spring til indhold",
    language_label: "Sprog",
  },
};
export default locale_da;
