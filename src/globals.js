// /////////////// //
// CLIENT ACTIONS //
// ///////////// //
// NOTE: all actions will have the 'player_id' property set upon being recieved by the server
// and when the action is created/sent by the server, it also given that property
const blank_action = 0; 
const move_unit    = 1; // { pos:    unit_id: cleanup_ind:             }
const attack_unit  = 2; // { target: unit_id: cleanup_ind: new_health: } // both are unit_id's, new_health is sent back from the server
const create_unit  = 3; // { pos:    unit:    cleanup_ind:             } // 'unit_id' is passed back in when recieved by the server // 'unit' refers to the type of unit

// original piece not seen - actions // ONLY SENT FROM SERVER
const create_move_unit   = 4; // { pos: og_pos: unit_type: unit_id:             }
const create_attack_unit = 5; // { target: pos: unit_type: unit_id: new_health: }
const blind_attack_unit  = 6; // { target_pos:  unit_id:                        }

const destroy_unit       = 7; // { unit_id:                                     }

const discover_unit      = 8; // { pos: unit: unit_id:} 


const unit_soldier_color = 0x29FF7A;
const unit_worker_color = 0xFFD300;
const unit_sniper_color = 0xFF4600;
const unit_tower_color = 0x000000;


// ////////////////////// //
// SERVER COMMUNICATIONS //
// //////////////////// //
// data types that server sends to clients
//

const SERVER_confirm_sqiggle = 0;  // code                        // reply to client test sqiggle
const SERVER_join_failure    = 1;  // reason                      // used to tell client that their info was not accepted, and that they will have to try again=
const SERVER_message         = 2;  // { text: user_id: }          // replicate a message from server to all connected clients
const SERVER_init_player     = 3;  // { id: players: seed: money} // when a new player joins, send them the list of all the current players and some starter info
const SERVER_new_player      = 4;  // player                      // for when a new player joins, send the info to all current players
const SERVER_time_update     = 5;  // { turn_time: action_time: } // updates the time for clients
const SERVER_request_moves   = 6;  // NULL                        // to tell players to send in their moves, 
const SERVER_sendback_moves  = 7;  // moves                       // sending back the moves that players will recieve
// unimplemented //
const SERVER_players_ready   = 8;  // count                       // telling players how many are ready


// const SERVER_change_seed     = 8;  // undecided on this yet, seems like it would be a performance hit

// ////////////////////// //
// CLIENT COMMUNICATIONS //
// //////////////////// //
// data types that clients send to servers
//

const CLIENT_test_sqiggle   = 0;  // code             // sent to the server to confirm that its a sqiggle server
const CLIENT_joining        = 1;  // {name: color: }  // sent to server to request to join with data
const CLIENT_submit_moves   = 2;  // moves            // reply to server's request moves message
const CLIENT_user_message   = 3;  // message          // user sends a message to share with the other players
// unimplemented //
const CLIENT_early_submit   = 4;  // moves            // allows user to submit moves early
const CLIENT_early_retract  = 5;  // NULL             // allows user to revoke their submitted moves, so they can make different moves
// NOTE: i think we should store recieved actions on the players as individual lists
// that way if they remove the submission we could easily null it