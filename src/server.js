
//
var max_turn_time = 10;
var turn_time = max_turn_time;
var max_action_time = 5;
var action_time = max_action_time;


// /////////////////////////////////////////// //
// DEBUG SCRIPT TO SKIP PHASES ON ENTER PRESS //
// ///////////////////////////////////////// //

// window.addEventListener("keypress", DEBUG_PRESS);
// function DEBUG_PRESS(event){
//     if (event.key === 'Enter'){
//         if (action_time == max_action_time){
//             turn_time = 0;
//             tick();
//         }
//         else{
//             action_time = 0;
//             tick();
//         }
//     }
// }
//create_tile_circle(0,0, 5);
//move_camera_to_coords([0,0]);

// ///////////// //
// CONSOLE CODE //
// /////////// //
var console_textbox = document.getElementById("console_text");
const con_error = '#ff0000';
const con_warning = '#ffda00';
const con_success = '#00ff00';
const con_debug = '#ffffff';
const con_note = '#00ddff';
post_to_console("UI loaded", con_success);
function post_to_console(message, color){
    let newSpan = document.createElement('span');
    let currentdate = new Date(); 
    newSpan.innerHTML = "[" + currentdate.getHours() + ":"  
                            + currentdate.getMinutes() + ":" 
                            + currentdate.getSeconds() + "] - " + message + "\r\n";
    newSpan.style.color = color;
    console_textbox.appendChild(newSpan);
}
function client_error(err){
    let connection = this;
    post_to_console("Client error from: " + get_username_of_connection(connection.peer) + ": " + err, con_error);
}
function server_error(err){
    post_to_console("Server error: "+err, con_error);
}
// ///////////////// //
// CONSOLE COMMANDS //
// /////////////// //
CMDs_list = {
    help:       {func: CMD_help,                 hint: "outputs a list of all commands, or the hint of the param: command name. or to print all hints, param: 'all'" },
    whois_name: {func: CMD_connections_under,    hint: "prints player data linked to param: player name"},
    whois_conn: {func: CMD_whois,                hint: "prints player data linked to param: connection id"},
    whois_id:   {func: CMD_whois_id,             hint: "prints player data linked to param: player id"},
    start:      {func: start_game,               hint: "begins the match"},
    round_time: {func: CMD_set_round_time,       hint: "sets the max round time to param: duration"},
    action_time:{func: CMD_set_action_time,      hint: "sets the max action time to param: duration"},
    pause:      {func: CMD_toggle_pause,         hint: "pauses the game if unpaused, unpauses if paused"},
    players:    {func: CMD_print_player_details, hint: "prints out all players, or the player data specified by param: connection_id/id/name"},
    seed:       {func: CMD_get_seed,             hint: "prints out the current session's seed string"},
    id:         {func: CMD_get_session_id,       hint: "prints the current session's id (players will need this to connect)"},
    clear:      {func: CMD_clear_chat,           hint: "clears all text from the console output window"},
}
function process_cmd(command, params){
    let cmd = CMDs_list[command];
    if (cmd == null) {
        post_to_console("Command \"" + command + "\" not found, try using \"/help\" for the full list", con_warning);
        return;
    }
    cmd.func(params);
}
function CMD_help(specific_command){
    if (specific_command == null){
        let string = "All commands: ";
        for (let key in CMDs_list){
            string += '"' + key + '" ';
        }
        post_to_console(string, con_debug);
    }
    else if (specific_command == "all"){
        for (let key in CMDs_list){
            post_to_console(key + ": " + CMDs_list[key].hint, con_debug);
        }
    }
    else{
        let cmd = CMDs_list[specific_command];
        if (cmd == null){
            post_to_console("Command \"" + specific_command + "\" not found, try using \"/help\" for the full list", con_warning);
            return;
        }
        post_to_console('"' + specific_command + '": ' + cmd.hint, con_debug);
    }
}
function CMD_whois(player_connection_id){
    let player = players[player_connection_id];
    if (player == null){
        post_to_console("there is no with connection: \"" + player_connection_id + "\"", con_warning);
        return;
    }
    print_player_details(player);
}
function CMD_connections_under(player_name){
    let matched_players = get_user_OBJECTS_from_name(player_name);
    // test to see if the list was empty
    if (matched_players.length == 0){
        post_to_console("there are no connections with username: \"" + player_name + "\"", con_warning);
        return;
    }
    // else print list
    for (let j = 0; j < matched_players.length; j++){
        print_player_details(matched_players[j]);
    }
}
function CMD_whois_id(player_id){
    let found_player = get_user_object_from_id(player_id);
    if (found_player != null){
        //post_to_console("player id [" + found_player.id + "] is connection id: " + found_player.connection_id, con_debug);
        print_player_details(found_player);
        return;
    }
    post_to_console("there are no players with id: \"" + player_id + "\"", con_warning);
}
var is_game_running = false;
var is_game_paused = false;
function start_game(garbage){
    if (is_game_running){
        post_to_console("The game is already running", con_warning);
        return;
    }
    is_game_running = true
    post_to_console("The game is now started", con_success);
    send_message('server', "The game has now started!");
    setInterval(tick, 1000);
}
function CMD_set_round_time(round_time){
    if (round_time == null){
        post_to_console("you need to specify the parameter", con_warning);
        return;
    }
    try {
        max_turn_time = Number(round_time);
        post_to_console("round time updated to [" + round_time + "] seconds", con_success);
        send_message('server', "Round time has been changed to [" + round_time + "] Seconds!");
    }catch{
        post_to_console("failed to process number", con_warning);
        return;
    }
}
function CMD_set_action_time(action_time){
    if (round_time == null){
        post_to_console("you need to specify the parameter", con_warning);
        return;
    }
    try {
        max_action_time = Number(action_time);
        post_to_console("action time updated to [" + action_time + "] seconds", con_success);
        send_message('server', "Action time has been changed to [" + action_time + "] Seconds!");
    }catch{
        post_to_console("failed to process number", con_warning);
        return;
    }
}
function CMD_toggle_pause(garbage){
    if (!is_game_running){
        post_to_console("game cannot be paused if it is not running yet", con_warning);
        return;
    }
    is_game_paused = !is_game_paused;
    if (is_game_paused){
        post_to_console("game is now paused", con_success);
        send_message('server', "The round timer is now paused!");
    }
    else{
        post_to_console("game is now unpaused", con_success);
        send_message('server', "The round timer is now running again!");
    }
}
function CMD_print_player_details(specific_player){
    if (specific_player == "" || specific_player == null){
        // regular print all
        for (let key in players){
            print_player_details(players[key]);
        } 
        return;
    }

    {   // first attempt to match connection id
        let found_player = players[specific_player];
        if (found_player != null){
            print_player_details(found_player);
            return;
    }}
    
    {   // then attempt to match player id
        let found_player = get_user_object_from_id(specific_player);
        if (found_player != null){
            print_player_details(found_player);
            return;
    }}

    {   // then attempt to match player name
        let matched_players = get_user_OBJECTS_from_name(specific_player);
        if (matched_players.length > 0){
            for (let j = 0; j < matched_players.length; j++){
                print_player_details(matched_players[j]);
            }
            return;
    }}

    // failed to match with anything
    post_to_console("failed to find any matches with: \"" + specific_player + "\"", con_warning);
    return;
}
function print_player_details(player_object){
    if (player_object == null){
        post_to_console("invalid player object", con_warning);
        return;
    }
    post_to_console("["+player_object.id+"]: " + player_object.name + ", " + player_object.color + ", " + player_object.connection_id, con_debug);
}
function CMD_get_seed(garbage){
    post_to_console("the session seed is: " + seed, con_debug);
}
function CMD_get_session_id(garbage){
    post_to_console("the session id is: " + server_id, con_debug);
}
function CMD_clear_chat(garbage){
    console_textbox.replaceChildren();
}


// ////// //
// STUFF //
// //// //

var players = {
    server: {
        name: "SERVER", 
        id: -1,
        color: "#ffd200",
        // server managed data
        connection: null, 
        connection_id: null,
        vis_units: {}, // not used on server player
        vis_tiles: {}, // not used on server player 
        recieved_moves: null // also not used on ther server player
    }
};
UI_addplayer(players["server"].name, players["server"].id, players["server"].color);
var lastplayerid = 1;
function get_all_players_simple(){
    let simple_players = [];
    for (let key in players){
        simple_players.push(parse_player_into_simple(key));
    }
    return simple_players;
}
function parse_player_into_simple(key){
    return parse_player_object_into_simple(players[key]);
}
function parse_player_object_into_simple(player){
    if (player == null){
        console.log("bad player object")
        return null;
    }
    return {
        name: player.name,
        id: player.id,
        color: player.color
    }
}
// use a had - index table? would be harwder to maintain if we made changes to the index array
// so best idea would be to mkae the array into a dictionary of sorts, wqe ere we just insert the connection id
// this would allow us to identify each client based on their respective connection
function get_user_object_from_id(user_id){
    for (let j in players){
        if (players[j].id == user_id){
            return players[j];
        }
    }
    return null;
}
function get_user_OBJECTS_from_name(username){
    let found_players = [];
    for (let key in players){
        let current = players[key];
        if (current.name == username){
            found_players.push(current);
    }}
    return found_players;
}
function get_username_of_connection(connection){
    let player = players[connection];
    if (player != null){
        return '"' + player.name + '"';
    }
    return connection; // so we still get text otherwise
}

var server_units = {};

// ///////////// //
// SERVER SETUP //
// /////////// //
var chatbox_field_text = document.getElementById("chatbox_field");
var gamecode_text = document.getElementById("gamecode_box");
var serverchatbox_text = document.getElementById("server_message_field");
var playernames_text = document.getElementById("playernames_field");
var server = new Peer();
var server_id = null; // yeah this is literally an attribute of server whatever
var pending_players = [];

var seed = Math.random().toString();

server.on('error', server_error);
post_to_console("Session Seed is: \"" + seed + '"', con_debug);

server.on("open", (id) => {
    post_to_console("Server has initialized", con_success);
    post_to_console("Session ID: " + id, con_debug);
    // paste this into the text boxes
    gamecode_text.innerText = id;
    server_id = id;
});
server.on("connection", (client) => {
    post_to_console("Client connecting: " + client.peer, con_success);
    pending_players.push(client);

    client.on("data", recieved_data_from_client);
    client.on('error', client_error);
});
 // saving this for later, so we can notify of disconnects etc
server.on('disconnect', (id) => {
    post_to_console("Supposed disconnect for id: " + id, con_error);
});

function recieved_data_from_client(data){
    let connection = this;
    if (data.type == undefined) {
        post_to_console("Received non defined data from: " + get_username_of_connection(connection.peer) + ": " + data.id, con_warning);
    }
    else if (data.type == CLIENT_user_message){
        post_to_console("Message from: " + get_username_of_connection(connection.peer), con_debug);
        send_message(connection.peer, data.content);
    }
    else if (data.type == CLIENT_joining){
        // add new player according to the data that they've chosen
        // content.name
        // coneten.color
        if (!is_playerinfo_valid(connection, data.content)) {
            return; // connection failed, sent back explanation why
        }
        // setup the new player
        let new_player = {
            name: data.content.name, 
            id: lastplayerid,
            color: data.content.color,
            // server managed data
            connection: connection, 
            connection_id: connection.peer,
            actions_recieved: true, // so if they join mid action collection, they will not foce the game to wait
            vis_units: {}, // not used on server player
            vis_tiles: {}, // not used on server player 
            recieved_moves: null
        }
        post_to_console("Client joined: " + get_username_of_connection(connection.peer), con_success);
        // tell everyone that a new player has joined
        broadcast_to_all_players(SERVER_new_player, parse_player_object_into_simple(new_player));
        players[connection.peer] = new_player; // assign it after so we dont send the new joiner that packet
        // fill this player in with the currently loaded players, including themself, give them the id so they can match everything up
        connection.send({type: SERVER_init_player, content: {id: lastplayerid, seed: seed, players: get_all_players_simple()}})
        lastplayerid++; // so the next player has a unique id

        // queue them for recieiving their initial pieces next turn
        // pick a random tile to set this player up
        // [-64-64, -64-64] //
        let off_x = Math.floor(Math.random() * 129) - 64;
        let off_y = Math.floor(Math.random() * 129) - 64;
        all_players_actions.push({ type: create_unit, pos: [off_x  , off_y  ], player_id: new_player.id, unit: unit_soldier, cleanup_ind: -1 })
        all_players_actions.push({ type: create_unit, pos: [off_x  , off_y+1], player_id: new_player.id, unit: unit_worker,  cleanup_ind: -1 })
        all_players_actions.push({ type: create_unit, pos: [off_x+1, off_y  ], player_id: new_player.id, unit: unit_soldier, cleanup_ind: -1 })
        all_players_actions.push({ type: create_unit, pos: [off_x+1, off_y+1], player_id: new_player.id, unit: unit_worker,  cleanup_ind: -1 })

        send_message('server', new_player.name + " has joined the game!");
        UI_addplayer(new_player.name, new_player.id, new_player.color);
    }
    else if (data.type == CLIENT_test_sqiggle){
        if (data.content != "Hello!"){
            post_to_console("bad connection message from: " + get_username_of_connection(connection.peer) + ": " + data.content, con_warning);
            // we should then close the connection, no idea how to do that though
            return;
        }
        connection.send({type:SERVER_confirm_sqiggle, content:"Welcome!"});
        post_to_console("successful init message from: " + get_username_of_connection(connection.peer), con_success);
    }
    else if (data.type == CLIENT_submit_moves){
        if (!is_awaiting_feedback){
            post_to_console("recieved moves at wrong time from: " + get_username_of_connection(connection.peer), con_warning);
            // we should then close the connection, no idea how to do that though
            return;
        }
        // ok first we need to label each action as created by this player
        let sender_id = players[connection.peer].id;
        for (let j = 0; j < data.content.length; j++){
            data.content[j]['player_id'] = sender_id;
        }
        // cycle through all players and check if they're done yet
        all_players_actions = all_players_actions.concat(data.content);
        players[connection.peer].actions_recieved = true;
        // look for non server players that haven't sumitted yet
        // if there are any, then we are still waiting for them to submit
        let moves_recieved = 0;
        let moves_total = 0;
        for (let p_key in players){
            if (players[p_key].connection == null) continue; // do not run for server
            moves_recieved++;
            if (players[p_key].actions_recieved == undefined || players[p_key].actions_recieved == true){
                moves_total++
            }
        }
        post_to_console("recieved ["+ data.content.length +"] moves from: " + get_username_of_connection(connection.peer) + ", " + moves_total +'/' + moves_recieved, con_note);

        if (moves_recieved == moves_total){
            // if we didn't return, then we all players have submitted
            commit_actions();
        }
    }
    else{
        post_to_console("recieved invalid packet type from: " + get_username_of_connection(connection.peer) + ": " + data.type, con_warning);
    }
    
    // add all other possbile inputs
}

function is_playerinfo_valid(connection, content){
    // test if the connection already exists
    if (players[connection.peer] != null){
        post_to_console("Client trying to connect, but already connected: " + get_username_of_connection(connection.peer), con_warning);
        connection.send({type:SERVER_join_failure, content:"player id is already connected"});
        return false;
    }
    // test if the username was fine, include more filters if need be
    if (content.name == undefined || content.name == ""){
        post_to_console("Client submitted empty username: " + get_username_of_connection(connection.peer), con_warning);
        connection.send({type:SERVER_join_failure, content:"player id is already connected"});
        return false;
    }
    if (content.color == undefined || content.color.length != 7 || content.color[0] != '#' || !(/^[0-9a-fA-F]+$/.test(content.color.substring(1))) ){
        post_to_console("Client submitted bad color code: " + get_username_of_connection(connection.peer), con_warning);
        connection.send({type:SERVER_join_failure, content:"the color must begin with a hash, followed by 6 hexadecimal digits (0-9, a-f) example: #5a129c"});
        return false;
    }
    return true;
}

// server copy info buttons
function copy_gamecode(){
    if (server_id != null){
        navigator.clipboard.writeText(server_id);
}}
function copy_gamelink(){
    console.log("feature not currently supported, support it now");
}


function tick(){
    // not the best solution, but it works for now
    if (is_game_paused) return; // if paused then do not progress the timer
    // count timer down and display time to all players
    // upon time reaching 0, proceed to action phase
    if (is_awaiting_feedback) return;
    if (turn_time > 0){
        turn_time -= 1;
    }else{
        // if we hit 0, run it
        if (action_time == max_action_time){
            request_user_actions();
        }
        action_time -= 1;
        if (action_time < 0){
            turn_time = max_turn_time;
            action_time = max_action_time;
    }}
    time_update(turn_time, action_time)
}
var is_awaiting_feedback = false;
var all_players_actions = [];
function request_user_actions(){
    is_awaiting_feedback = true;
    request_clients_moves();
    
    for (let key in players){
        if (players[key].connection == null) continue; // do not run for server
        players[key].actions_recieved = false;
    }
    // we delay this function as a fallback for if players did not recieve the request to submit their actions
    setTimeout(fallback_commit_actions, 2000);
    return;
}
function fallback_commit_actions(){
    // if already got all the actions back, skip this
    if (!is_awaiting_feedback) return;
    commit_actions();
}
function commit_actions()
{
    is_awaiting_feedback = false;

    // FETCH ALL QUEUED ACTIONS
    // execute all actions submitted by players
    // attacks are performed first, then movements
    // if a player's piece is lost, then notify that users?
    // also notify new damage states to users
    /// notifiy users of piece changes
    // if a piece moves into a user's view position then give them the info for this new unit
    // if a unit moves out of range, then request that that user now disregard that unit (delete it from their game instance)
    // if a unit's range changes, then we also need to notify users

    // setup all properties 
    for (let key in players){
        if (players[key].connection == null) continue; // do not run for server
        players[key].recieved_moves = [];
    }

    // do server side processing of the actions to make sure that no sus stuff is happening
    // also fixup the good actions and add them to the list
    let played_units = {}; // use this to keep track of if the users are trying to be cheeky and move pieces that they aren't supposed to
    let destroyed_units = [];

    let created_unit_actions = [];

    // ///////////////////////// //
    // PROCESS CREATION ACTIONS //
    // /////////////////////// //
    for (let j = 0; j < all_players_actions.length; j++){
        if (all_players_actions[j].type != create_unit) continue; 
        // double check that the players aren't glitching it
        if (server_is_anything_in_the_way(all_players_actions[j].pos)){   
            console.log("[SERVER] player attempted to create unit at the position of another unit, not allowed");
            continue;
        }
        // generate new id for this unit, then pass back the info       
        let server_unit = SERVER_CREATE_UNIT(all_players_actions[j].unit, all_players_actions[j].pos, all_players_actions[j].player_id); 
        server_units[server_unit.pos[0]+','+server_unit.pos[1]] = server_unit;
        created_unit_actions.push({ type: create_unit, unit_id: server_unit.unit_id, unit: server_unit.type, pos: server_unit.pos, cleanup_ind: all_players_actions[j].cleanup_ind, player_id: all_players_actions[j].player_id });
        played_units[server_unit.unit_id] = 1;
    }
    // /////////////////////// //
    // PROCESS ATTACK ACTIONS //
    // ///////////////////// //
    for (let j = 0; j < all_players_actions.length; j++){
        let catt_act = all_players_actions[j];
        if (catt_act.type != attack_unit) continue;
        // check to see if a move has already been performed with this unit
        if (played_units[catt_act.unit_id] != undefined){
            console.log("[SERVER] unit " + catt_act.unit_id + " has already made a move this turn");
            continue;
        }
        // test whether the unit actually exists
        let moved_unit = get_server_unit_by_id(catt_act.unit_id);
        if (moved_unit == null){
            console.log("[SERVER] player attempted to move non-existing unit, not allowed")
            continue;
        }
        // test whether the target exists
        let target_unit = get_server_unit_by_id(catt_act.target);
        if (target_unit == null){
            console.log("[SERVER] player attempted to attack non-existing unit, not allowed")
            continue;
        }
        // test whether the player actually owns this unit
        if (moved_unit.owner != catt_act.player_id){
            console.log("[SERVER] player attempted to move unit they dont own")
            continue;
        }
        // and then test whether the player DOES NOT own the target
        if (target_unit.owner == catt_act.player_id){
            console.log("[SERVER] player attempted to attack unit that they own")
            continue;
        }

        // perform is in range check

        // maybe perform damage test
        target_unit.defense -= moved_unit.attack;
        if (target_unit.defense <= 0){ // target was killed
            destroyed_units.push(target_unit);
        }
        played_units[moved_unit.unit_id] = 1;
        // send back the action
        
        
        // can see the attacker and target, regular attack
        // can see the attacker but not target, we need to do a diff attack
        // can see target but not attacker, do a create attack
        let attacker_key = moved_unit.pos[0] + ','+ moved_unit.pos[1];
        let target_key = target_unit.pos[0] + ','+ target_unit.pos[1];
        for (let j in players){
            let curr_player = players[j];
            if (curr_player.connection == null) continue; // do not run for server
            let sees_attacker = curr_player.vis_units[attacker_key] != null;
            let sees_target = curr_player.vis_units[target_key] != null;
            if (sees_attacker && sees_target){
                curr_player.recieved_moves.push({ type: attack_unit, unit_id: moved_unit.unit_id, target_unit: target_unit.unit_id, new_health: target_unit.defense, cleanup_ind: catt_act.cleanup_ind, player_id: catt_act.player_id });
            }
            else if (sees_attacker){
                curr_player.recieved_moves.push({ type: blind_attack_unit, unit_id: moved_unit.unit_id, target_pos: target_unit.pos, cleanup_ind: catt_act.cleanup_ind, player_id: catt_act.player_id });
            }
            else if (sees_target){
                curr_player.recieved_moves.push({ type: create_attack_unit, unit_type: moved_unit.type, unit_id: moved_unit.unit_id, target_unit: target_unit.unit_id, new_health: target_unit.defense, cleanup_ind: catt_act.cleanup_ind, player_id: catt_act.player_id });
            }
            // else they dont see anything occur
        }
    }
    // we want something in here to prevetn units from moving if thye have infact been destroyed first
    // or else that might confuse players when they attack a piece and it retreats in the same turn
    // resulting in it looking like the piece did not die but it would have actually died, hjust it escaped bewforew it did
    // ///////////////////////// //
    // PROCESS MOVEMENT ACTIONS //
    // /////////////////////// //
    for (let j = 0; j < all_players_actions.length; j++){
        let cmov_act = all_players_actions[j];
        if (cmov_act.type != move_unit) continue;
        // check to see if a move has already been performed with this unit
        if (played_units[cmov_act.unit_id] != undefined){
            console.log("[SERVER] unit " + cmov_act.unit_id + " has already made a move this turn");
            continue;
        }
        // we need to confirm that there are no objects in the way of this movement
        if (server_is_anything_in_the_way(cmov_act.pos)){
            console.log("[SERVER] player attempted to move unit to the location of another unit, not allowed")
            continue;
        }
        // test whether the unit actually exists
        let moved_unit = get_server_unit_by_id(cmov_act.unit_id);
        if (moved_unit == null){
            console.log("[SERVER] player attempted to move non-existing unit, not allowed")
            continue;
        }
        // test whether the player actually owns this unit
        if (moved_unit.owner != cmov_act.player_id){
            console.log("[SERVER] player attempted to move unit they dont own")
            continue;
        }
        // lastly we need to check if the movement is actually in range AKA VALID

        // update the dictionary to contain the new location of this moved unit
        let curr_unit_key = moved_unit.pos[0] + ',' + moved_unit.pos[1];
        let new_unit_key = cmov_act.pos[0] + ',' + cmov_act.pos[1];
        let og_pos = moved_unit.pos.slice(0);

        delete server_units[curr_unit_key];
        server_units[new_unit_key] = moved_unit;
        moved_unit.pos = cmov_act.pos;
        // submit the verified information back to clients
        played_units[moved_unit.unit_id] = 1;

        // for each player
        for (let j in players){
            let curr_player = players[j];
            if (curr_player.connection == null) continue; // do not run for server
            
            let sees_unit = curr_player.vis_units[curr_unit_key] != null;
            let sees_new_pos = curr_player.vis_tiles[new_unit_key] != null;
            // owner gets free pass to push 
            if (curr_player.id == moved_unit.owner){
                curr_player.recieved_moves.push({ type: move_unit, unit_id: moved_unit.unit_id, pos: moved_unit.pos, cleanup_ind: cmov_act.cleanup_ind, player_id: cmov_act.player_id });
                delete curr_player.vis_units[curr_unit_key];
                curr_player.vis_units[new_unit_key] = 1;
                player_see_area(curr_player, moved_unit.pos[0], moved_unit.pos[1], moved_unit.vision_range);
                player_stop_seeing_area(curr_player, og_pos[0], og_pos[1], moved_unit.vision_range);
            }
            // if they can see this unit, pushback unit move
            else if (sees_unit){ // we dont need to see the final position, because the client will themselves figure out if the piece should lose visibility or not
                curr_player.recieved_moves.push({ type: move_unit, unit_id: moved_unit.unit_id, pos: moved_unit.pos, cleanup_ind: cmov_act.cleanup_ind, player_id: cmov_act.player_id });
                delete curr_player.vis_units[curr_unit_key];
                if (sees_new_pos){
                    curr_player.vis_units[new_unit_key] = 1;
                }
            }
            // if they can see the tile that they move to, pushback moveto_create
            else if (sees_new_pos){
                curr_player.recieved_moves.push({ type: create_move_unit, unit_type: moved_unit.type, unit_id: moved_unit.unit_id, og_pos: og_pos, pos: moved_unit.pos, cleanup_ind: cmov_act.cleanup_ind, player_id: cmov_act.player_id });
                curr_player.vis_units[new_unit_key] = 1;
            }
            // else they dont see it before/after, so nothing happens
        }
    }

    // //////////////////////// //
    // PROCESS DESTROYED UNITS //
    // ////////////////////// //
    for (let j = 0; j < destroyed_units.length; j++){
        // then delete the unit from the match
        let destroyed_unit_key = get_server_unit_KEY_by_id(destroyed_units[j].unit_id);
        for (let key in players){
            let curr_player = players[key];
            if (curr_player.connection == null) continue; // do not run for server
            // clear sight for owner
            if (curr_player.id == server_units[destroyed_unit_key].owner){
                curr_player.recieved_moves.push({ type: destroy_unit, unit_id: destroyed_units[j].unit_id });
                player_stop_seeing_area(curr_player, server_units[destroyed_unit_key].pos[0], server_units[destroyed_unit_key].pos[1], server_units[destroyed_unit_key].vision_range);
                delete curr_player.vis_units[destroyed_unit_key];
            }
            // else clear the unit from seen units
            else if (curr_player.vis_units[destroyed_unit_key] != null){
                curr_player.recieved_moves.push({ type: destroy_unit, unit_id: destroyed_units[j].unit_id });
                delete curr_player.vis_units[destroyed_unit_key];
            }
        }
        // i feel like theres more references that we need to scrub when doing this
        delete server_units[destroyed_unit_key];
    }

    // ////////////////////////////// //
    // REPROCESS THE CREATION EVENTS //
    // //////////////////////////// //
    for (let j = 0; j < created_unit_actions.length; j++){
        // we also need to process this for other players, so maybe we will have to make the creation event actually visally occur after teh move and attack events,
        // but it will still have priority over the ther two events in terms of taking that position
        let new_unit_action = created_unit_actions[j];

        let creator = get_user_object_from_id(new_unit_action.player_id);
        if (creator == null){
            post_to_console("creation event has no owner", con_warning);
            continue;
        }
        let unit = get_server_unit_by_id(new_unit_action.unit_id);
        // add the unit to their list of units that they can see
        // the function will handle the terrain stuff, and spottingf units on the new tiles
        let unit_key = unit.pos[0] + ','+ unit.pos[1];
        creator.vis_units[unit_key] = 1;
        player_see_area(creator, unit.pos[0], unit.pos[1], unit.vision_range);
        // we automatically push this for the owner
        creator.recieved_moves.push(new_unit_action);

        for (let j in players){
            let curr_player = players[j];
            if (curr_player.connection == null) continue; // do not run for server
            if (curr_player != creator && curr_player.vis_tiles[new_unit_key] != null){
                curr_player.push({ type: create_unit, unit_id: server_unit.unit_id, unit: server_unit.type, pos: server_unit.pos, cleanup_ind: new_unit_action.cleanup_ind, player_id: new_unit_action.player_id });
                curr_player.vis_units[unit_key] = 1;
            }
        }
    }


    post_to_console("Action phase over, recieved [" + all_players_actions.length + "] actions", con_debug);
    submit_moves_to_client();
    // second submit a list of actions back that the client should see
    // this is how we'll beable to thin down what each client actually gets sent
    all_players_actions = [];
}
// functions to manage what each player actually sees
function player_see_area(player_object, x, y, radius){
    // test if the aareaa is not seen yet, if we cannot see it, check it for any units
    // if we can see any units here, thne add create unit events for this player
    // we would have to run this after the fact of the other events being run or else we could get some weird stuff 
    for (let row = -radius; row <= radius; row++) {
        let items_in_this_row = ((radius*2) + 1) - Math.abs(row);
        let row_left_x = x - (radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));
        for (let column = 0; column < items_in_this_row; column++) {
            // test if this tile exists
            let tile_key = (row_left_x + column) + ',' + (y + row);
            if (player_object.vis_tiles[tile_key] == null){
                player_object.vis_tiles[tile_key] = 1;
                // now we need to let the player know if something exists here or not
                if (server_units[tile_key] != null){
                    player_object.vis_units[tile_key] = server_units[tile_key];
                    player_object.recieved_moves.push({ type: discover_unit, unit_id: server_units[tile_key].unit_id, unit: server_units[tile_key].type, pos: server_units[tile_key].pos, player_id: server_units[tile_key].owner });
            }}else{
                player_object.vis_tiles[tile_key] += 1;
}}}}
function player_stop_seeing_area(player_object, x, y, radius){
    // none of ther events inside this funcetion ned to be telegraphed to the players
    // as we will be locally handling that, and assuming that the data between client and server stay in sync
    for (let row = -radius; row <= radius; row++) {
        let items_in_this_row = ((radius*2) + 1) - Math.abs(row);
        let row_left_x = x - (radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));
        for (let column = 0; column < items_in_this_row; column++) {
            // test if this tile exists
            let tile_key = (row_left_x + column) + ',' + (y + row);
            if (player_object.vis_tiles[tile_key] != null){
                player_object.vis_tiles[tile_key] -= 1;
                // test whether this was the last reference to this tile
                if (player_object.vis_tiles[tile_key] <= 0){
                    delete player_object.vis_tiles[tile_key];
                    // then delete any unit on that tile
                    if (player_object.vis_units[tile_key] != null){
                        delete player_object.vis_units[tile_key];
}}}}}}



function server_is_anything_in_the_way(pos_array){
    let str_position = pos_array[0]+','+pos_array[1];
    return (server_units[str_position] != null);
}
function get_server_unit_by_id(unit_id){
    for (let unit in server_units){
        if (server_units[unit].unit_id == unit_id) return server_units[unit];
    }
    return null;
}
function get_server_unit_KEY_by_id(unit_id){
    for (let unit in server_units){
        if (server_units[unit].unit_id == unit_id) return unit;
    }
    return null;
}

function send_message_as_server(){
    let message = serverchatbox_text.value;
    serverchatbox_text.value = "";  // clear text input
    // check ot see if the message is actually a command
    if (message.length > 0 && message[0] == '/'){
        let space_index = message.indexOf(' ');
        // no space, so just send the command as is; no params
        if (space_index < 0){
            process_cmd(message.substring(1))
            return;
        }
        // send command and params
        process_cmd(message.substring(1, space_index), message.substring(space_index + 1))
        return;
    }

    send_message('server', message);
}
function send_message(connection_id, outbound_message){
    if (outbound_message == "" || outbound_message == null || outbound_message == undefined) return;
    if (players[connection_id] == null) return;
    // get username based off of userid
    message = "[" + players[connection_id].name + "]: " + outbound_message + '</br>';
    // wrap it in the specific html so its colored
    // then print the message off, just for the server
    UI_add_message(message, players[connection_id].color);
    // ok now replicate
    broadcast_to_all_players(SERVER_message, {text: message, user_id: players[connection_id].id});
}

function broadcast_to_all_players(message_type, message_content){
    for (let key in players){
        if (players[key].connection != null) {
            players[key].connection.send({type:message_type, content:message_content});
}}}


// ///////////////////////////////// //
// SERVER TO CLIENT GAME NETWORKING //
// /////////////////////////////// //
function time_update(current, attack){
    broadcast_to_all_players(SERVER_time_update, {turn_time: current, action_time: attack});
}
function request_clients_moves(){
    broadcast_to_all_players(SERVER_request_moves);
}
// this now submits each player's queues to ONLY themselves, we aren't pooling all actions to all players
function submit_moves_to_client(){
    for (let key in players){
        if (players[key].connection != null){ // check to make sure this isn't the server
            players[key].connection.send({type:SERVER_sendback_moves, content:players[key].recieved_moves});
    }}
}

// ///////////////////////////////// //
// CLIENT TO SERVER GAME NETWORKING //
// /////////////////////////////// //
function client_submitting_moves(){

}