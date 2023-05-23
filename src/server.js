
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
    help: {func: CMD_help, hint: "outputs a list of all commands, or the hint of the param: command name" },
    whois_name: {func: CMD_connections_under, hint: "fetches connection_id linked to param: player name"},
    whois_conn: {func: CMD_whois, hint: "fetches player name linked to param: connection id"},
    start: {func: start_game, hint: "begins the match"},
    round_time: {func: CMD_set_round_time, hint: "sets the max round time to param: duration"},
    action_time: {func: CMD_set_action_time, hint: "sets the max action time to param: duration"},
    pause: {func: CMD_toggle_pause, hint: "pauses the game if unpaused, unpauses if paused"}
}
function process_cmd(command, params){
    let cmd = CMDs_list[command];
    if (cmd == null) {
        post_to_console("Command \"" + specific_command + "\" not found, try using \"/help\" for the full list", con_warning);
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
    post_to_console("connection \"" + player_connection_id + "\" is \"" + player.name + "\"", con_debug);
}
function CMD_connections_under(player_name){
    let string = "connections with username: \"" + player_name + "\": ";
    let num_of_matches = 0;
    for (let key in players){
        let current = players[key];
        if (current.name == player_name){
            num_of_matches++;
            string += '"' + current.connection_id + '" ';
    }}
    if (num_of_matches > 0){
        post_to_console(string, con_debug);
        return;
    }
    post_to_console("there are no connections with username: \"" + player_name + "\"", con_warning);
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
// CMD PLAYER LIST
// CMD GAME SEED
// CMD GAME SESSION ID

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
        vis_units: null, // not used on server player
        vis_tiles: null, // not used on server player 
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
    for (let j = 0; j < players.length; j++){
        if (players[j].id == user_id) return players[j];
}}
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
/* // saving this for later, so we can notify of disconnects etc
server.on('disconnect', function (id) {
  var idx = connected.indexOf(id); // only attempt to remove id if it's in the list
  if (idx !== -1) {connected.splice(idx, 1);}
});
*/
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
            vis_units: null, // not used on server player
            vis_tiles: null, // not used on server player 
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
            if (players[p_key].id >= 0){
                moves_recieved++;
                if (players[p_key].actions_recieved == undefined || players[p_key].actions_recieved == true){
                    moves_total++
                }
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
        if (players[key].id >= 0){
            players[key].actions_recieved = false;
    }}
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

    // do server side processing of the actions to make sure that no sus stuff is happening
    // also fixup the good actions and add them to the list
    let actions_to_sendback = [];
    let played_units = {}; // use this to keep track of if the users are trying to be cheeky and move pieces that they aren't supposed to
    let destroyed_units = [];
    // ///////////////////////// //
    // PROCESS CREATION ACTIONS //
    // /////////////////////// //
    for (j = 0; j < all_players_actions.length; j++){
        if (all_players_actions[j].type != create_unit) continue; 
        // double check that the players aren't glitching it
        if (server_is_anything_in_the_way(all_players_actions[j].pos)){   
            console.log("[SERVER] player attempted to create unit at the position of another unit, not allowed");
            continue;
        }
        // generate new id for this unit, then pass back the info       
        server_unit = SERVER_CREATE_UNIT(all_players_actions[j].unit, all_players_actions[j].pos, all_players_actions[j].player_id); 
        server_units[server_unit.pos[0]+','+server_unit.pos[1]] = server_unit;
        actions_to_sendback.push({ type: create_unit, unit_id: server_unit.unit_id, unit: server_unit.type, pos: server_unit.pos, cleanup_ind: all_players_actions[j].cleanup_ind, player_id: all_players_actions[j].player_id });
    }
    // /////////////////////// //
    // PROCESS ATTACK ACTIONS //
    // ///////////////////// //
    for (j = 0; j < all_players_actions.length; j++){
        if (all_players_actions[j].type != attack_unit) continue;
        // check to see if a move has already been performed with this unit
        if (played_units[all_players_actions[j].unit_id] != undefined){
            console.log("[SERVER] unit " + all_players_actions[j].unit_id + " has already made a move this turn");
            continue;
        }
        // test whether the unit actually exists
        let moved_unit = get_server_unit_by_id(all_players_actions[j].unit_id);
        if (moved_unit == null){
            console.log("[SERVER] player attempted to move non-existing unit, not allowed")
            continue;
        }
        // test whether the target exists
        let target_unit = get_server_unit_by_id(all_players_actions[j].target);
        if (target_unit == null){
            console.log("[SERVER] player attempted to attack non-existing unit, not allowed")
            continue;
        }
        // test whether the player actually owns this unit
        if (moved_unit.owner != all_players_actions[j].player_id){
            console.log("[SERVER] player attempted to move unit they dont own")
            continue;
        }
        // and then test whether the player DOES NOT own the target
        if (target_unit.owner == all_players_actions[j].player_id){
            console.log("[SERVER] player attempted to attack unit that they own")
            continue;
        }

        // perform is in range check

        // maybe perform damage test
        target_unit.defense -= moved_unit.attack;
        if (target_unit.defense <= 0){ // target was killed
            destroyed_units.push(target_unit);
        }
        // send back the action
        actions_to_sendback.push({ type: attack_unit, unit_id: all_players_actions[j].unit_id, target_unit: all_players_actions[j].target, new_health: target_unit.defense, cleanup_ind: all_players_actions[j].cleanup_ind, player_id: all_players_actions[j].player_id });
    }
    // ///////////////////////// //
    // PROCESS MOVEMENT ACTIONS //
    // /////////////////////// //
    for (j = 0; j < all_players_actions.length; j++){
        if (all_players_actions[j].type != move_unit) continue;
        // check to see if a move has already been performed with this unit
        if (played_units[all_players_actions[j].unit_id] != undefined){
            console.log("[SERVER] unit " + all_players_actions[j].unit_id + " has already made a move this turn");
            continue;
        }
        // we need to confirm that there are no objects in the way of this movement
        if (server_is_anything_in_the_way(all_players_actions[j].pos)){
            console.log("[SERVER] player attempted to move unit to the location of another unit, not allowed")
            continue;
        }
        // test whether the unit actually exists
        let moved_unit = get_server_unit_by_id(all_players_actions[j].unit_id);
        if (moved_unit == null){
            console.log("[SERVER] player attempted to move non-existing unit, not allowed")
            continue;
        }
        // test whether the player actually owns this unit
        if (moved_unit.owner != all_players_actions[j].player_id){
            console.log("[SERVER] player attempted to move unit they dont own")
            continue;
        }
        // lastly we need to check if the movement is actually in range AKA VALID

        // update the dictionary to contain the new location of this moved unit
        delete server_units[moved_unit.pos[0] + ',' + moved_unit.pos[1]];
        server_units[all_players_actions[j].pos[0] + ',' + all_players_actions[j].pos[1]] = moved_unit;
        moved_unit.pos = all_players_actions[j].pos;
        // submit the verified information back to clients
        actions_to_sendback.push({ type: move_unit, unit_id: moved_unit.unit_id, pos: moved_unit.pos, cleanup_ind: all_players_actions[j].cleanup_ind, player_id: all_players_actions[j].player_id });
        played_units[moved_unit.unit_id] = 1;
    }

    // //////////////////////// //
    // PROCESS DESTROYED UNITS //
    // ////////////////////// //
    for (let j = 0; j < destroyed_units.length; j++){
        actions_to_sendback.push({ type: destroy_unit, unit_id: destroyed_units[j].unit_id });
        // then delete the unit from the match
        let destroyed_unit_key = get_server_unit_KEY_by_id(destroyed_units[j].unit_id);
        // i feel like theres more references that we need to scrub when doing this
        delete server_units[destroyed_unit_key];
    }

    post_to_console("Action phase over, recieved [" + all_players_actions.length + "] actions, [" + actions_to_sendback.length + "] were sent", con_debug);
    submit_moves_to_client(actions_to_sendback);
    // second submit a list of actions back that the client should see
    // this is how we'll beable to thin down what each client actually gets sent
    all_players_actions = [];
}
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
function submit_moves_to_client(actions_to_sendback){
    broadcast_to_all_players(SERVER_sendback_moves, actions_to_sendback);
}

// ///////////////////////////////// //
// CLIENT TO SERVER GAME NETWORKING //
// /////////////////////////////// //
function client_submitting_moves(){

}