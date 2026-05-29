// Keybind data extracted from JetBrains PyCharm Reference Card
const KEYBINDS = [
  // MASTER YOUR IDE
  { id: "find_action", category: "Master Your IDE", action: "Find action…", keybind: "Ctrl+Shift+A" },
  { id: "tool_window", category: "Master Your IDE", action: "Open a tool window", keybind: "Alt+[0-9]" },
  { id: "synchronize", category: "Master Your IDE", action: "Synchronize", keybind: "Ctrl+Alt+Y" },
  { id: "switch_scheme", category: "Master Your IDE", action: "Quick switch scheme…", keybind: "Ctrl+`" },
  { id: "settings", category: "Master Your IDE", action: "Settings…", keybind: "Ctrl+Alt+S" },
  { id: "jump_source_nav", category: "Master Your IDE", action: "Jump to source / navigation bar", keybind: "F4 / Alt+Home", conflicts: true },
  { id: "jump_last_tool", category: "Master Your IDE", action: "Jump to last tool window", keybind: "F12", conflicts: true },
  { id: "hide_tool_windows", category: "Master Your IDE", action: "Hide active / all tool windows", keybind: "Shift+Esc / Ctrl+Shift+F12" },
  { id: "next_prev_tab", category: "Master Your IDE", action: "Go to next / previous editor tab", keybind: "Alt+Right / Alt+Left", conflicts: true },
  { id: "go_to_editor", category: "Master Your IDE", action: "Go to editor (from tool window)", keybind: "Esc" },
  { id: "close_tab_window", category: "Master Your IDE", action: "Close active tab / window", keybind: "Ctrl+Shift+F4 / Ctrl+F4" },

  // FIND EVERYTHING
  { id: "search_everywhere", category: "Find Everything", action: "Search everywhere", keybind: "Double Shift" },
  { id: "find_replace", category: "Find Everything", action: "Find / replace", keybind: "Ctrl+F / Ctrl+R", conflicts: true },
  { id: "find_replace_path", category: "Find Everything", action: "Find in path / Replace in path", keybind: "Ctrl+Shift+F / Ctrl+Shift+R", conflicts: true },
  { id: "next_prev_occurrence", category: "Find Everything", action: "Next / previous occurrence", keybind: "F3 / Shift+F3" },
  { id: "find_word_caret", category: "Find Everything", action: "Find word at caret", keybind: "Ctrl+F3" },
  { id: "go_class_file", category: "Find Everything", action: "Go to class / file", keybind: "Ctrl+N / Ctrl+Shift+N", conflicts: true },
  { id: "go_file_member", category: "Find Everything", action: "Go to file member", keybind: "Ctrl+F12" },
  { id: "go_symbol", category: "Find Everything", action: "Go to symbol", keybind: "Ctrl+Alt+Shift+N" },

  // NAVIGATE FROM SYMBOLS
  { id: "declaration", category: "Navigate From Symbols", action: "Declaration", keybind: "Ctrl+B" },
  { id: "type_declaration", category: "Navigate From Symbols", action: "Type declaration (JS only)", keybind: "Ctrl+Shift+B", conflicts: true },
  { id: "super_method", category: "Navigate From Symbols", action: "Super method", keybind: "Ctrl+U", conflicts: true },
  { id: "implementations", category: "Navigate From Symbols", action: "Implementation(s)", keybind: "Ctrl+Alt+B" },
  { id: "find_usages", category: "Navigate From Symbols", action: "Find usages / Find usages in file", keybind: "Alt+F7 / Ctrl+F7" },
  { id: "highlight_usages", category: "Navigate From Symbols", action: "Highlight usages in file", keybind: "Ctrl+Shift+F7" },
  { id: "show_usages", category: "Navigate From Symbols", action: "Show usages", keybind: "Ctrl+Alt+F7" },

  // REFACTOR AND CLEAN UP
  { id: "refactor_this", category: "Refactor and Clean Up", action: "Refactor this…", keybind: "Ctrl+Alt+Shift+T" },
  { id: "copy_move", category: "Refactor and Clean Up", action: "Copy… / Move…", keybind: "F5 / F6", conflicts: true },
  { id: "safe_delete", category: "Refactor and Clean Up", action: "Safe delete…", keybind: "Alt+Delete" },
  { id: "rename", category: "Refactor and Clean Up", action: "Rename…", keybind: "Shift+F6" },
  { id: "change_signature", category: "Refactor and Clean Up", action: "Change signature…", keybind: "Ctrl+F6" },
  { id: "inline", category: "Refactor and Clean Up", action: "Inline…", keybind: "Ctrl+Alt+N" },
  { id: "extract_method", category: "Refactor and Clean Up", action: "Extract method", keybind: "Ctrl+Alt+M" },
  { id: "introduce_var_param", category: "Refactor and Clean Up", action: "Introduce variable / parameter", keybind: "Ctrl+Alt+V / Ctrl+Alt+P" },
  { id: "introduce_field_const", category: "Refactor and Clean Up", action: "Introduce field / constant", keybind: "Ctrl+Alt+F / Ctrl+Alt+C" },
  { id: "reformat_code", category: "Refactor and Clean Up", action: "Reformat code", keybind: "Ctrl+Alt+L" },

  // CREATE AND EDIT
  { id: "intention_actions", category: "Create and Edit", action: "Show intention actions", keybind: "Alt+Enter" },
  { id: "basic_completion", category: "Create and Edit", action: "Basic code completion", keybind: "Ctrl+Space" },
  { id: "smart_completion", category: "Create and Edit", action: "Smart code completion", keybind: "Ctrl+Shift+Space" },
  { id: "type_completion", category: "Create and Edit", action: "Type name completion", keybind: "Ctrl+Alt+Space" },
  { id: "complete_statement", category: "Create and Edit", action: "Complete statement", keybind: "Ctrl+Shift+Enter" },
  { id: "param_context", category: "Create and Edit", action: "Parameter info / context info", keybind: "Ctrl+P / Alt+Q", conflicts: true },
  { id: "quick_definition", category: "Create and Edit", action: "Quick definition", keybind: "Ctrl+Shift+I", conflicts: true },
  { id: "quick_external_doc", category: "Create and Edit", action: "Quick / external documentation", keybind: "Ctrl+Q / Shift+F1" },
  { id: "generate_code", category: "Create and Edit", action: "Generate code", keybind: "Alt+Insert" },
  { id: "override_implement", category: "Create and Edit", action: "Override / implement members", keybind: "Ctrl+O / Ctrl+I" },
  { id: "surround_with", category: "Create and Edit", action: "Surround with…", keybind: "Ctrl+Alt+T" },
  { id: "line_comment", category: "Create and Edit", action: "Comment with line comment", keybind: "Ctrl+/" },
  { id: "extend_shrink", category: "Create and Edit", action: "Extend / shrink selection", keybind: "Ctrl+W / Ctrl+Shift+W", conflicts: true },
  { id: "optimize_imports", category: "Create and Edit", action: "Optimize imports", keybind: "Ctrl+Alt+O" },
  { id: "auto_indent", category: "Create and Edit", action: "Auto-indent lines", keybind: "Ctrl+Alt+I" },
  { id: "cut_copy_paste", category: "Create and Edit", action: "Cut / Copy / Paste", keybind: "Ctrl+X / Ctrl+C / Ctrl+V" },
  { id: "copy_doc_path", category: "Create and Edit", action: "Copy document path", keybind: "Ctrl+Shift+C" },
  { id: "paste_history", category: "Create and Edit", action: "Paste from clipboard history", keybind: "Ctrl+Shift+V" },
  { id: "duplicate_line", category: "Create and Edit", action: "Duplicate current line or selection", keybind: "Ctrl+D", conflicts: true },
  { id: "move_line", category: "Create and Edit", action: "Move line up / down", keybind: "Ctrl+Shift+Up / Ctrl+Shift+Down" },
  { id: "delete_line", category: "Create and Edit", action: "Delete line at caret", keybind: "Ctrl+Y" },
  { id: "join_split_line", category: "Create and Edit", action: "Join / split line", keybind: "Ctrl+Shift+J / Ctrl+Enter", conflicts: true },
  { id: "new_line", category: "Create and Edit", action: "Start new line", keybind: "Shift+Enter" },
  { id: "toggle_case", category: "Create and Edit", action: "Toggle case", keybind: "Ctrl+Shift+U" },
  { id: "expand_collapse", category: "Create and Edit", action: "Expand / collapse code block", keybind: "Ctrl+NumPad+ / Ctrl+NumPad-" },
  { id: "expand_collapse_all", category: "Create and Edit", action: "Expand / collapse all", keybind: "Ctrl+Shift+NumPad+ / Ctrl+Shift+NumPad-" },
  { id: "save_all", category: "Create and Edit", action: "Save all", keybind: "Ctrl+S", conflicts: true },

  // VERSION CONTROL
  { id: "vcs_popup", category: "Version Control", action: "VCS operations popup…", keybind: "Alt+`" },
  { id: "commit", category: "Version Control", action: "Commit", keybind: "Ctrl+K", conflicts: true },
  { id: "update_project", category: "Version Control", action: "Update project", keybind: "Ctrl+T", conflicts: true },
  { id: "recent_changes", category: "Version Control", action: "Recent changes", keybind: "Alt+Shift+C" },
  { id: "revert", category: "Version Control", action: "Revert", keybind: "Ctrl+Alt+Z" },
  { id: "push", category: "Version Control", action: "Push…", keybind: "Ctrl+Shift+K", conflicts: true },
  { id: "next_prev_change", category: "Version Control", action: "Next / previous change", keybind: "Ctrl+Alt+Shift+Down / Ctrl+Alt+Shift+Up" },

  // ANALYZE AND EXPLORE
  { id: "show_error", category: "Analyze and Explore", action: "Show error description", keybind: "Ctrl+F1" },
  { id: "next_prev_error", category: "Analyze and Explore", action: "Next / previous highlighted error", keybind: "F2 / Shift+F2" },
  { id: "run_inspection", category: "Analyze and Explore", action: "Run inspection by name…", keybind: "Ctrl+Alt+Shift+I" },
  { id: "type_call_hierarchy", category: "Analyze and Explore", action: "Type / call hierarchy", keybind: "Ctrl+H / Ctrl+Alt+H" },

  // NAVIGATE IN CONTEXT
  { id: "select_in", category: "Navigate In Context", action: "Select in…", keybind: "Alt+F1" },
  { id: "recent_viewed_locations", category: "Navigate In Context", action: "Recently viewed / recent locations", keybind: "Ctrl+E / Ctrl+Shift+E", conflicts: true },
  { id: "last_edit_location", category: "Navigate In Context", action: "Last edit location", keybind: "Ctrl+Shift+Backspace" },
  { id: "navigate_back_forward", category: "Navigate In Context", action: "Navigate back / forward", keybind: "Ctrl+Alt+Left / Ctrl+Alt+Right" },
  { id: "prev_next_method", category: "Navigate In Context", action: "Go to previous / next method", keybind: "Alt+Up / Alt+Down" },
  { id: "go_line_column", category: "Navigate In Context", action: "Go to line / column…", keybind: "Ctrl+G", conflicts: true },
  { id: "code_block_end_start", category: "Navigate In Context", action: "Go to code block end / start", keybind: "Ctrl+] / Ctrl+[" },
  { id: "add_favorites", category: "Navigate In Context", action: "Add to favorites", keybind: "Alt+Shift+F" },
  { id: "toggle_bookmark", category: "Navigate In Context", action: "Toggle bookmark", keybind: "F11" },
  { id: "toggle_bookmark_mnemonic", category: "Navigate In Context", action: "Toggle bookmark with mnemonic", keybind: "Ctrl+F11" },
  { id: "go_numbered_bookmark", category: "Navigate In Context", action: "Go to numbered bookmark", keybind: "Ctrl+[0-9]" },
  { id: "show_bookmarks", category: "Navigate In Context", action: "Show bookmarks", keybind: "Shift+F11" },

  // BUILD, RUN, AND DEBUG
  { id: "run_context", category: "Build, Run, and Debug", action: "Run context configuration", keybind: "Ctrl+Shift+F10" },
  { id: "run_debug_selected", category: "Build, Run, and Debug", action: "Run / debug selected configuration", keybind: "Alt+Shift+F10 / F9" },
  { id: "run_debug_current", category: "Build, Run, and Debug", action: "Run / debug current configuration", keybind: "Shift+F10 / F9" },
  { id: "step_over_into", category: "Build, Run, and Debug", action: "Step over / into", keybind: "F8 / F7" },
  { id: "smart_step_into", category: "Build, Run, and Debug", action: "Smart step into", keybind: "Shift+F7" },
  { id: "step_out", category: "Build, Run, and Debug", action: "Step out", keybind: "Shift+F8" },
  { id: "run_to_cursor", category: "Build, Run, and Debug", action: "Run to cursor / Force run to cursor", keybind: "Alt+F9 / Ctrl+Alt+F9" },
  { id: "show_execution", category: "Build, Run, and Debug", action: "Show execution point", keybind: "Alt+F10" },
  { id: "evaluate_expression", category: "Build, Run, and Debug", action: "Evaluate expression…", keybind: "Alt+F8" },
  { id: "stop", category: "Build, Run, and Debug", action: "Stop", keybind: "Ctrl+F2" },
  { id: "stop_background", category: "Build, Run, and Debug", action: "Stop background processes…", keybind: "Ctrl+Shift+F2" },
  { id: "resume_program", category: "Build, Run, and Debug", action: "Resume program", keybind: "F9" },
  { id: "toggle_breakpoint", category: "Build, Run, and Debug", action: "Toggle line breakpoint", keybind: "Ctrl+F8" },
  { id: "toggle_temp_breakpoint", category: "Build, Run, and Debug", action: "Toggle temporary line breakpoint", keybind: "Ctrl+Alt+Shift+F8" },
  { id: "edit_breakpoint", category: "Build, Run, and Debug", action: "Edit / view breakpoint", keybind: "Ctrl+Shift+F8" },
];

const CATEGORIES = [...new Set(KEYBINDS.map(k => k.category))];

const CATEGORY_ICONS = {
  "Master Your IDE": "🖥️",
  "Find Everything": "🔍",
  "Navigate From Symbols": "🧭",
  "Refactor and Clean Up": "♻️",
  "Create and Edit": "✏️",
  "Version Control": "🔀",
  "Analyze and Explore": "🔬",
  "Navigate In Context": "📍",
  "Build, Run, and Debug": "🛠️"
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1600, 2400, 3500, 5000, 7000, 10000, 14000, 20000, 28000, 40000];

const ACHIEVEMENTS = [
  { id: "first_session", name: "🌱 First Steps", desc: "Complete your first session", check: s => s.totalSessions >= 1 },
  { id: "ten_sessions", name: "🔟 Dedicated", desc: "Complete 10 sessions", check: s => s.totalSessions >= 10 },
  { id: "fifty_sessions", name: "🎓 Veteran", desc: "Complete 50 sessions", check: s => s.totalSessions >= 50 },
  { id: "first_perfect", name: "💯 Perfect Session", desc: "Get 100% in a session (min 5 cards)", check: s => s.perfectSessions >= 1 },
  { id: "streak_5", name: "🔥 On Fire", desc: "Get a streak of 5 correct", check: s => s.bestStreak >= 5 },
  { id: "streak_10", name: "🌟 Unstoppable", desc: "Get a streak of 10 correct", check: s => s.bestStreak >= 10 },
  { id: "streak_20", name: "⚡ Legendary", desc: "Get a streak of 20 correct", check: s => s.bestStreak >= 20 },
  { id: "learn_10", name: "📚 Getting Started", desc: "Learn 10 keys", check: s => s.keysLearned >= 10 },
  { id: "learn_25", name: "📖 Halfway There", desc: "Learn 25 keys", check: s => s.keysLearned >= 25 },
  { id: "learn_all", name: "🏆 Master", desc: "Learn all keys", check: s => s.keysLearned >= KEYBINDS.length },
  { id: "level_5", name: "⭐ Level 5", desc: "Reach level 5", check: s => s.level >= 5 },
  { id: "level_10", name: "👑 Level 10", desc: "Reach level 10", check: s => s.level >= 10 },
  { id: "daily_streak_3", name: "📅 Consistent", desc: "3-day login streak", check: s => s.currentStreak >= 3 },
  { id: "daily_streak_7", name: "🗓️ Week Warrior", desc: "7-day login streak", check: s => s.currentStreak >= 7 },
  { id: "xp_1000", name: "💎 1K XP", desc: "Earn 1000 total XP", check: s => s.totalXP >= 1000 },
  { id: "xp_5000", name: "💠 5K XP", desc: "Earn 5000 total XP", check: s => s.totalXP >= 5000 },
];
