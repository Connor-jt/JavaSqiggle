// do message ui updating and player ui updating

var UI_chatbox = document.getElementById("chatbox_field");
var UI_players_box = document.getElementById("playernames_field");
var UI_players = {};

function UI_addplayer(playername, player_id, player_color){
    var newSpan = document.createElement('span');
    newSpan.innerHTML = playername + "\r\n";
    newSpan.style.color = player_color;
    UI_players_box.appendChild(newSpan);
    UI_players[player_id] = newSpan;
}
function UI_removeplayer(player_id){
    UI_players_box.removeChild(UI_players[player_id]);
    delete UI_players[player_id];
}

function UI_add_message(message, color){
    var newSpan = document.createElement('span');
    newSpan.innerHTML = message;
    newSpan.style.color = color;
    UI_chatbox.appendChild(newSpan);
}
// doesn't appear to be needed at the moment 
/*
function filter_for_naughty_content(string){
    return string.replace(/<|>|&/g, "");
}
*/