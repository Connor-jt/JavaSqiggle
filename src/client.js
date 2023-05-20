// some notes for the next time i work on this

// we want the pieces to drop down on to the board with the terrain appearing first
// could be cool for the terrain to fade in??

// we need to make a sytem to allow units to queue movements to tiles that other units would vacate
// // we also need to update the sytem to execute actions in order
// we also need a system to handle actions in order of type: create, attack, move

// unit movement system
// prematurely move units before we submit the move?
// we need a system so that units cant queue to go to the same spot
// and a system so that units to queue to move to spots that other units are queued to leave
// no idea how we're gonna do that, but we'll make it work



// ///////////////////// //
// INITIALIZATION LOGIC //
// /////////////////// //
//initialize();


var scene;
var renderer;
var camera;
var controls;

var timer_text = document.getElementById("timer");
var action_text = document.getElementById("action_indicator");
var action_active_text = document.getElementById("action_phase_text");
var messagebox_text = document.getElementById("client_message_field");

function initialize(map_seed){
    let seed_gen = get_rand_func(map_seed);
    let seed_gen2 = get_rand_func('_' + map_seed); // THIS WILL be removed, and fixed at a later date

    lesser_noise2D = createNoise2D(seed_gen);
    greater_noise2D = createNoise2D(seed_gen2);

    scene = new THREE.Scene();
    
    scene.add(new THREE.GridHelper(100, 100));
    // /////////////////////////// //
    // SETUP DIRECTIONAL LIGHTING //
    // ///////////////////////// //
    const light_color = 0xFFFFFF;
    const light_intensity = 1;
    const light = new THREE.DirectionalLight(light_color, light_intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target);
    // ///////////// //
    // SETUP CAMERA //
    // /////////// //
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.z = 50;
    scene.add(camera);
    // /////////////// //
    // SETUP RENDERER //
    // ///////////// //
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.setClearColor(0x333F47, 1);
    // ///////////////// //
    // BIND WINDOW SIZE //
    // /////////////// //
    window.addEventListener('resize', function() {
        var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix(); });
    // /////////////// //
    // SETUP MOVEMENT //
    // ///////////// //
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.domElement.addEventListener( 'mousedown', client_mousedown, false );
    window.addEventListener("keypress", client_keydown);
    window.addEventListener( 'pointermove', onPointerMove );

    animate();
}

// /////////////////// //
// UNIT RUNTIME LOGIC //
// ///////////////// //
var currently_selected_unit = null;
var onscreen_units = {};
function get_client_unit_by_id(unit_id){
    for (let unit in onscreen_units){
        if (onscreen_units[unit].unit_id == unit_id) return onscreen_units[unit];
    }
    return null;
}
function does_unit_exist(query_unit_id){
    for (j = 0; j < onscreen_units.length; j++){
        if (onscreen_units[j].unit_id == query_unit_id) return true;
    } return false;
}
function does_unit_exist_at(x, y){
    let current_coords = x + ',' + y;
    let unit = onscreen_units[current_coords];
    return (unit != null);
}
function unit_see(unit, last_position){
    if (last_position != null){
        // clear the assigned terrain pieces at the last location
        delete_tile_circle(last_position[0],last_position[1], unit.vision_range);
    }
    create_tile_circle(unit.pos[0],unit.pos[1], unit.vision_range);
    move_camera_to_coords(unit.pos);
}
function select_unit(selec_unit){
    deselect_unit();
    if (selec_unit.owner != our_playerid) return; // do not select units that we dont own
    currently_selected_unit = selec_unit;
    preview_moves_at(selected_tile[0], selected_tile[1], currently_selected_unit.attack_range, currently_selected_unit.move_range, onscreen_units);
}
function select_unit_at(position_Array){
    let current_coords = position_Array[0] + ',' + position_Array[1];
    let unit = onscreen_units[current_coords];
    if (unit != null){
        select_unit(unit);
    }
}
function deselect_unit(){
    currently_selected_unit = null;
    preview_clear_moves();
}
function calculate_realworld_position_of(unit){
    let pos_string = unit.pos[0]+","+unit.pos[1];
    let pos_off = get_location_offset(unit.pos[0], unit.pos[1]);
    let tile_height = find_visual_hieght_at(pos_string, pos_off[0], pos_off[1]);
    return new THREE.Vector3(pos_off[0], tile_height, pos_off[1]);
}

// /////////////////// //
// RENDERING FUNCTION //
// ///////////////// //
function animate() {
    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
    controls.update();

    // update 3d mouse position
    onPointerMove();

    // runtime commit player actions to the gamestate
    if (current_action == undefined && current_action != null ) return;
    if (current_action == null){
        if(is_in_action_mode && has_recieved_actions) commit_next_action();
    } else{
        progress_current_action();
    }
}

// /////////////////// //
// GAME RUNTIME LOGIC //
// ///////////////// //
function prompt_text(){
    // this function will print text4 to the middle of the players screen
    // this will be used for general user feedbak, like "you aren't allowed to place units here"
    // or "piece has been lost"
    // or "capture the points to generate points"
    // or "use the number keys to placeunits"
    // idk, stuff like that
}

var current_action = null;
// need to have something that essentially breaks the flow if theres an action like moving or attacking
function commit_next_action(){
    if (actions_to_commit == undefined) return;
    if (actions_to_commit.length > 0){
        let next_action = actions_to_commit.shift();
        if      (next_action.type == create_unit)   create_piece(next_action);
        else if (next_action.type == move_unit)     move_piece(next_action);
        else if (next_action.type == attack_unit)   attack_piece(next_action);
    }
    if (actions_to_commit.length == 0 && !last_state_was_action) disable_action_mode();
}
function progress_current_action(){
    if      (current_action.type == create_unit)   PROGRESS_create_piece();
    else if (current_action.type == move_unit)     PROGRESS_move_piece();
    else if (current_action.type == attack_unit)   PROGRESS_attack_piece();
    else    current_action = null;
}
function move_piece(action){
    // we could probably do this after the piece moves, that would probably look nicer
    
    let target_unit = get_client_unit_by_id(action.unit_id);
    if (target_unit == null){
        console.log("[CLIENT] recieved move instruction for unit_id that has no matching unit");
        return;
    }

    let old_position_str = target_unit.pos[0]+","+target_unit.pos[1];
    let old_pos = [target_unit.pos[0], target_unit.pos[1]];
    // update the position on this unit
    delete onscreen_units[old_position_str];
    onscreen_units[action.pos[0] + ',' + action.pos[1]] = target_unit;
    target_unit.pos = action.pos;
    // render the new area for this piece
    unit_see(target_unit, old_pos);

    // now log all the data so we can animate
    // get the final destination real world position
    let pos_off = get_location_offset(target_unit.pos[0], target_unit.pos[1]);
    let action_tile_height = find_visual_hieght_at(old_position_str, pos_off[0], pos_off[1]);
    let dest_pos = new THREE.Vector3(pos_off[0], action_tile_height, pos_off[1]);
    let difference = dest_pos.clone().sub(target_unit.mesh.position);
    current_action = { type: move_unit, unit: target_unit, 
        destination: dest_pos,
        difference: difference,
        offset: 0.0,
        cleanup_ind: action.cleanup_ind
    };
}
const movement_speed = 0.045;
const jump_height = 4.5;
const jump_curve = 2.8;
function PROGRESS_move_piece(){
    current_action.offset += movement_speed;
    // check if we've now completed the movement, if so, end this action 
    if (current_action.offset >= 1){
        // cleanup the highlight
        clear_highlight_index(current_action.cleanup_ind);
        current_action.unit.mesh.position.copy(current_action.destination);
        console.log("object has finished moving")
        current_action = null;
        return;
    }
    let upwards_jump = 0;
    if (current_action.offset < 0.5){
        upwards_jump = (1 - Math.pow((1- (current_action.offset*2)), jump_curve)) * jump_height;
    }
    else if (current_action.offset > 0.5){
        upwards_jump = (1 - Math.pow((1- (1-((current_action.offset-0.5)*2))), jump_curve)) * jump_height;
    }
    else upwards_jump = jump_height; 

    let next_step_pos = current_action.destination.clone();
    next_step_pos.sub(current_action.difference.clone().multiplyScalar(1-current_action.offset));
    next_step_pos.y = next_step_pos.y + upwards_jump;
    current_action.unit.mesh.position.copy(next_step_pos);
}
function attack_piece(action){
    let attacker_unit = get_client_unit_by_id(action.unit_id);
    let target_unit = get_client_unit_by_id(action.target_unit);

    if (attacker_unit == null || target_unit == null){
        console.log("[CLIENT] recievedd instruction to attack piece that does not exist");
        return;
    }

    let dest = calculate_realworld_position_of(target_unit);
    let origin = calculate_realworld_position_of(attacker_unit);
    current_action = { type: attack_unit, unit: attacker_unit, 
        destination: dest,
        origin: origin,
        difference: dest.clone().sub(origin),
        offset: 0.0,
        outbound: true,
        cleanup_ind: action.cleanup_ind
    };

}
const attack_movement_speed = 0.045;
const attack_jump_height = 4.5;
const attack_jump_curve = 2.8;
function PROGRESS_attack_piece(){
    if (current_action.outbound){
        current_action.offset += attack_movement_speed;
        if (current_action.offset >= 1.0){
            current_action.outbound = false; // aka we're heading back now
        }
    }
    else{ // heading back
        current_action.offset -= attack_movement_speed;
        // check if we've now completed the movement, if so, end this action 
        if (current_action.offset <= 0.0){
            // cleanup the highlight
            clear_highlight_index(current_action.cleanup_ind);
            current_action.unit.mesh.position.copy(current_action.origin);
            console.log("object has finished attacking")
            current_action = null;
            return;
        }
    }
    let upwards_jump = 0;
    if (current_action.offset < 0.5){
        upwards_jump = (1 - Math.pow((1- (current_action.offset*2)), attack_jump_curve)) * attack_jump_height;
    }
    else if (current_action.offset > 0.5){
        upwards_jump = (1 - Math.pow((1- (1-((current_action.offset-0.5)*2))), attack_jump_curve)) * attack_jump_height;
    }
    else upwards_jump = jump_height; 

    let next_step_pos = current_action.destination.clone();
    next_step_pos.sub(current_action.difference.clone().multiplyScalar(1-current_action.offset));
    next_step_pos.y = next_step_pos.y + upwards_jump;
    current_action.unit.mesh.position.copy(next_step_pos);
}
const unit_drop_height = 25;
const unit_drop_gravity = 0.023;
const unit_drop_bounce_factor = 0.45;
function create_piece(action){ // this will be used in a lot of places i think
    let creator_player = return_player_from_id(action.player_id);
    let created_unit = CLIENT_CREATE_UNIT(action.unit, action.unit_id, action.pos, creator_player);
    // add it to the scene and adjust position to match the set position
    scene.add(created_unit.mesh);
    let pos_off = get_location_offset(created_unit.pos[0], created_unit.pos[1]);
    let position = created_unit.pos[0]+","+created_unit.pos[1];
    // create tiles first so that the visual height matches up
    // then we make them visualize
    create_tile_circle(created_unit.pos[0], created_unit.pos[1], created_unit.vision_range);
    move_camera_to_coords(created_unit.pos);

    onscreen_units[position] = created_unit;
    let action_tile_height = find_visual_hieght_at(position, pos_off[0], pos_off[1]);
    current_action = { type: create_unit, unit: created_unit, 
        destination: new THREE.Vector3(pos_off[0], action_tile_height, pos_off[1]),
        position: new THREE.Vector3(pos_off[0], action_tile_height + unit_drop_height, pos_off[1]),
        acceleraton: 0,
        cleanup_ind: action.cleanup_ind
    };
    created_unit.mesh.position.copy(current_action.position);

}
function PROGRESS_create_piece(){
    current_action.acceleraton += unit_drop_gravity;
    // bounce the object when it reaches the destination
    if (current_action.position.y <= current_action.destination.y){
        current_action.position.y = current_action.destination.y // do not go through
        current_action.acceleraton = current_action.acceleraton * -unit_drop_bounce_factor;
        // if the unit is under and is moving too slowly, then we can assume they've stopped bouncing
        if (Math.abs(current_action.acceleraton) < unit_drop_gravity*5 ){
            // cleanup the highlight
            clear_highlight_index(current_action.cleanup_ind);
            // finish bounce
            console.log("object has finished bouncing")
            current_action.unit.mesh.position.copy(current_action.destination);
            current_action = null;
            return;
        }
    }
    // update the object's position to the new one
    current_action.position.set(current_action.position.x, current_action.position.y - current_action.acceleraton, current_action.position.z);
    current_action.unit.mesh.position.copy(current_action.position);
}



var actions_to_commit = [];
var is_in_action_mode = false;
var has_recieved_actions = false;
var last_state_was_action = false;
function enable_action_mode(){
    deselect_unit();
    //toggle_stat_display(false, null); // hmm i dont think we should have this here
    has_recieved_actions = false;
    is_in_action_mode = true;
    last_state_was_action = true;
    // make the text visible
    action_active_text.style.visibility = "visible";
    document.body.style.cursor = "progress";
}
function disable_action_mode(){
    deselect_unit(); // just as a backup
    // then we try and select the unit that we're hovered over at the moment
    select_unit_at(selected_tile);

    is_in_action_mode = false;
    // make the text invisiable
    action_active_text.style.visibility = "collapse";
    // cleanup any denied actions
    let leftovers_counter = 0;
    for (let key in highlight_cleanups) {
        // access each key, remove from scene and then delete it
        while (highlight_cleanups[key].length > 0) {
            scene.remove(highlight_cleanups[key].pop());
        }
        delete highlight_cleanups[key];
        leftovers_counter++;
    }
    if (leftovers_counter > 0){
        console.log("[CLIENT] there were " + leftovers_counter + " denied actions, cleared")
    }
    update_cursor_type(); // so if we dont move cams, it'll still update
}
// //////////////////////// //
// SERVER CALLED FUNCTIONS //
// ////////////////////// //
function update_time(new_time, action_time){
    // occurs once a second // update the time left text & turn count
    timer_text.innerText = Math.floor(new_time/60) + ":" + new_time%60;
    action_text.innerText = "-".repeat(((new_time == 0)? action_time : 0 ));
    if (new_time <= 0){
        if (!last_state_was_action) enable_action_mode();
    } else if (last_state_was_action) {
        // check to see if we're still processing actions
        // if so, then its up to the action processor to allow us to act again
        last_state_was_action = false;
        if (actions_to_commit.length == 0) disable_action_mode();
    }
}
function recieve_server_message(){
    // here we just print the contents to the little message box at the bottom right
    // would be very useful to have for errors
}
function return_action_queue_and_cleanup(){
    var result = action_queue;
    action_queue = [];
    // while (highlight_cleanups.length > 0){
    //     scene.remove(highlight_cleanups.pop());
    // } 
    return result;
}

// ///////////////////////// //
// SERVER SENDING FUNCTIONS //
// /////////////////////// //
var action_queue = [];
var highlight_cleanups = {};
var curr_cleanup_index = 0;
function new_highlight_cleanup(the_entry){ // has to be in an array formT
    curr_cleanup_index++;
    highlight_cleanups[curr_cleanup_index] = the_entry;
    return curr_cleanup_index;
}
function clear_highlight_index(index){ // this probably isn't the best idea
    for (entries in highlight_cleanups[index] ){
        scene.remove(highlight_cleanups[index][entries]);
    }
    delete highlight_cleanups[index];
}

function count_highlight_cleanups(){
    let result = 1;
    for (c in highlight_cleanups) result++;
    return result;
}
function try_move_unit_to_pos(unit, to_coords){
    // first we need to check if this piece already has a move queued, then we should cancel their current move and assign a new one
    clear_units_prev_queued_move(unit.unit_id);
    if (!test_whether_pos_is_occupied(to_coords)) {
        QUEUE_move_piece(unit, to_coords);
    }
}
function QUEUE_move_piece(unit, to_coords){
    let cleanup_index = new_highlight_cleanup([action_hightlight_tile(to_coords[0], to_coords[1], move_unit), 
                                               action_hightlight_tile(unit.pos[0], unit.pos[1], create_unit, unit.type)]);
    action_queue.push({ type: move_unit, pos: to_coords, unit_id: unit.unit_id, cleanup_ind: cleanup_index })
}
function QUEUE_attack_piece(unit, target_unit){
    // clear their previous move if they had one
    // clear_units_prev_queued_move(unit_id);
    clear_units_prev_queued_move(unit.unit_id);
    
    let cleanup_index = new_highlight_cleanup([action_hightlight_tile(target_unit.pos[0], target_unit.pos[1], attack_unit), 
                                               action_hightlight_tile(unit.pos[0], unit.pos[1], create_unit, unit.type)]);
    action_queue.push({ type: attack_unit, target: target_unit.unit_id, unit_id: unit.unit_id, cleanup_ind: cleanup_index })
}
function try_place_unit_at_selected(type){
    if (!test_whether_pos_is_occupied(selected_tile)) {
        QUEUE_create_piece(type,selected_tile);
    }
}
function QUEUE_create_piece(type, coords){
    // here we put a highlight thing down, and we add it to a list of objects to flush when we submit all the actions
    let cleanup_index = new_highlight_cleanup([action_hightlight_tile(coords[0], coords[1], create_unit, type)]);
    action_queue.push({ type: create_unit, pos: coords, unit: type, cleanup_ind: cleanup_index })
}
function clear_units_prev_queued_move(unit_id){
    for (let j = 0; j < action_queue.length; j++){
        if (action_queue[j].type == move_unit || action_queue[j].type == attack_unit){
            if (action_queue[j].unit_id == unit_id){
                // cleanup their highlighted block
                clear_highlight_index(action_queue[j].cleanup_ind)
                action_queue.splice(j, 1);
                j--; // nlt needed but good practice anyway i think
            }
        }
    }
}
function test_whether_pos_is_occupied(position_arr){
    let position_string = selected_tile[0] + ',' + selected_tile[1];
    let unit = onscreen_units[position_string];
    if (unit != null) { // we also need a way of allowing units to move to a position that another unit is queued to leave
        return true;
    }
    // loop through the action queue to make sure nothing is already happening at this tile
    for (let j = 0; j < action_queue.length; j++){
        if (action_queue[j].type == create_unit){
            if (action_queue[j].pos[0] == position_arr[0] && action_queue[j].pos[1] == position_arr[1]){
                return true;
            }
        }else if (action_queue[j].type == move_unit){
            if (action_queue[j].pos[0] == position_arr[0] && action_queue[j].pos[1] == position_arr[1]){
                return true;
            }
        }else{ // attack unit // cant occur in the same spot?

        }
    }
    return false; // no occlusions found
}

// ////////////// //
// CLIENT INPUTS //
// //////////// //
// TODO: separate the pointer moved function stuff from the actual pointer moving
//       we need to have the function run on tick like it does, but the pointer moved merely updates the mouse pos

var last_hovered_tile = null;
var hovered_tile = null; 
var selected_tile = null; // use this for whatever
var last_cam_vec = new THREE.Vector3(); // so we can test the last
var last_last_vec = new THREE.Vector3(); // so we can determine if there was a change
var last_vec = new THREE.Vector3(); 
function onPointerMove( event ) {
    // update the location of the UI if its up
    if (is_stat_ui_visible){
        // ok now reposition it
        resposition_stats_UI(event);
    }

    // ///////////////////////// //
    // HIGHLIGHT HOVER POSITION // 
    // /////////////////////// //
    if (event != null){
        last_vec.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1,
            0.5 );

        last_vec.unproject( camera );
        last_vec.sub( camera.position ).normalize();
    }
    if (compare_vectors(last_last_vec, last_vec) && compare_vectors(last_cam_vec, controls.object.position)) return; // no movement in mouse or camera position
    if (last_vec == undefined) return;

    // store last states, so we can skip the calculations if there are no changes
    last_last_vec.copy(last_vec);
    last_cam_vec.copy(controls.object.position);

    // we basically iterate through each possbile height, and test whether a tile exists at those coords
    // we always pick the higher tile, as thats going to be the one that we're looking at
    // we need to test to see 
    let resulting_offset = [];
    for (let curr_height = 0; curr_height <= highest_recorded_height; curr_height++) {
        var test_vec = new THREE.Vector3(); // create once and reuse
        test_vec.copy(last_vec);
        var test_pos = new THREE.Vector3(); // create once and reuse
        
        var distance = ((curr_height*tile_height) - camera.position.y) / test_vec.y;
        test_pos.copy(camera.position).add(test_vec.multiplyScalar(distance) );

        let coords = approximate_tile_index(test_pos.x, test_pos.z); // annoying y & z flip

        let pos_off = get_location_offset(coords[0], coords[1]);
        let height = 0;
        // if this tile is visible, then we can get its height
        if (instanced_tiles[coords[0] + "," + coords[1]] != null) height = location_height(pos_off[0], pos_off[1]);
        // if this tile's height matches the height of the test, then we have a match
        if (height >= curr_height){
            resulting_offset = coords;
        }
    }
    hovered_tile = resulting_offset;
    // check to see if we highlighted a diff tile or not
    if (last_hovered_tile == null || last_hovered_tile[0] != hovered_tile[0] || last_hovered_tile[1] != hovered_tile[1]){
        hightlight_tile(resulting_offset[0], resulting_offset[1]);
        last_hovered_tile = hovered_tile.slice(0); // copy the offset so next tick we can compare again

        // update cursor type, as we're now looking at a diff tile
        let is_unit_visible = update_cursor_type();
        if (!is_stat_ui_visible && is_unit_visible){
            resposition_stats_UI(event);
        }
    }
}
// we actually need to return whether a unit was visible or not, so we can update the UI pos immediately
function update_cursor_type(){
    // alright lets check to see what type of cursor should be active right now
    if (is_in_action_mode) {
        // we still need to check if someone was there
        let hovered_over_unit_for_ui = onscreen_units[offset_str];
        if (hovered_over_unit_for_ui != null){
            toggle_stat_display(true, hovered_over_unit_for_ui);
            return true; 
        }
        return false; // no cursor types in action mode
    }
    

    let offset_str = hovered_tile[0] + ',' + hovered_tile[1];

    let known_tile_test = instanced_tiles[offset_str]
    if (known_tile_test == null){ // tile is not known
        document.body.style.cursor = "help";
        toggle_stat_display(false, null);
        return false;
    }

    let move_tile = movement_visual_tiles[offset_str];
    let range_tile = range_visual_tiles[offset_str];

    let hovered_over_unit = onscreen_units[offset_str];

    if (hovered_over_unit != null){
        toggle_stat_display(true, hovered_over_unit);
        // if its an enemy
        if (hovered_over_unit.owner != our_playerid){
            if (range_tile != null || move_tile != null){ // in attack range
                document.body.style.cursor = "alias";
                return true;
            }
            // not in range
            document.body.style.cursor = "no-drop";
            return true;
        }
        // elses its friendly
        document.body.style.cursor = "pointer";
        return true;
    }
    toggle_stat_display(false, null);
    if (range_tile != null){
        document.body.style.cursor = "zoom-out";
        return false;
    }
    if (move_tile != null){
        document.body.style.cursor = "move";
        return false;
    }

    document.body.style.cursor = "auto";
    return false;
}
var hover_stat_ui = document.getElementById("stats_ui");
var hover_stat_attack = document.getElementById("hint_attack_text");
var hover_stat_health = document.getElementById("hint_health_text");
var is_stat_ui_visible = true;
function toggle_stat_display(is_enabled, unit_obj){
    is_stat_ui_visible = is_enabled;
    if (is_stat_ui_visible){ // make it show up
        hover_stat_ui.style.visibility = "visible";
        // set the variables
        hover_stat_attack.innerHTML = unit_obj.attack;
        hover_stat_health.innerHTML = unit_obj.defense;
    }
    else{
        hover_stat_ui.style.visibility = "collapse";
    }
}
function resposition_stats_UI(event){
    hover_stat_ui.style.left = ""+((event.clientX / window.innerWidth ) * 100)+"%";
    hover_stat_ui.style.top  = "calc("+((event.clientY / window.innerHeight) * 100)+"% + 35px";
}

// /////////////////////////////// //
// ORIENTATION LOCATION FUNCTIONS //
// ///////////////////////////// //

function move_camera_to_coords(new_coords){
    hovered_tile = new_coords;
    move_camera_to_hovered_coords();
}
function move_camera_to_hovered_coords(){
    selected_tile = hovered_tile; // note down where the selected tile now is
    let _pos_off = get_location_offset(hovered_tile[0], hovered_tile[1]);
    let coords_Str = hovered_tile[0]+","+hovered_tile[1];
    let _height = find_visual_hieght_at(coords_Str, _pos_off[0], _pos_off[1])
    controls.goto_offset(_pos_off[0], _pos_off[1], _height+camera_height_above_tile);
    hightlight_selected_tile(_pos_off[0], _pos_off[1], _height); 

}
function interact_with_selected_tile(){
    // if theres a unit here, select them
    // this will inadvertedly make us automatically select units that we create
    // unless we create multiple in the same go, then it will select the last one, or probably the first one actually, after everything is done
    let coords_str = selected_tile[0]+","+selected_tile[1];
    let at_unit = onscreen_units[coords_str];
    if (at_unit != null){
        if (currently_selected_unit != null && currently_selected_unit != at_unit){
            // ok so we either reselected the same unit
            // are trying to attack another unit
            // or are trying to select a different unit
            // also trying to select a friendly unit in range of the previously selected unit
            
            // deselect_unit();
            // attack target unit
            if ( at_unit.owner != our_playerid && (movement_visual_tiles[coords_str] != null || range_visual_tiles[coords_str] != null)){
                // then they are in range and can be attacked
                // call attacking function


                QUEUE_attack_piece(currently_selected_unit, at_unit);
                deselect_unit();

            }
            else{ // select that unit, although we should have considered team check stuff for these conditons because we're goi ng to have to rewrite these
                select_unit(at_unit);
            }
        }
        // if we already have a unit selected, compare teams and attempt to attack
        else{
            // select unit
            select_unit(at_unit);
        }
    }
    // if there isn't a unit there, but there is a movement tile, then we start moving our selected unit there
    else if (currently_selected_unit != null) {
        // ok then check to see if this is a marked movement tile
        if (movement_visual_tiles[coords_str] != null){
            // then lets send a prompt to move here
            try_move_unit_to_pos(currently_selected_unit, selected_tile);
        }
        deselect_unit();
    }
}
const camera_height_above_tile = 5;

// ////////////////////// //
// CLIENT CONTROL INPUTS //
// //////////////////// //
function client_mousedown(event) {
    event.preventDefault();
    if (event.button === 0){// left click
        move_camera_to_hovered_coords();
        if (!is_in_action_mode) interact_with_selected_tile();
    }else{ // we aren't allowing the controls to use the left click, because that will be heavily used by the game
        controls.onMouseDown(event);
}}
function compare_vectors(a, b){
    if (a == undefined || b == undefined) return true;
    return a.x == b.x && a.y == b.y && a.z == b.z;
}

function client_keydown(event){
    if (is_in_action_mode) return; // skip actions if we're in action
    if (event.key === '1'){ // attemp to create unit at selected coords
        try_place_unit_at_selected(unit_soldier);
    } else if (event.key === '2'){ 
        try_place_unit_at_selected(unit_worker);
    } else if (event.key === '3'){ 
        try_place_unit_at_selected(unit_sniper);
    } else if (event.key === '4'){ 
        try_place_unit_at_selected(unit_tower);
    }
}



// /////////////////////////// //
// NETWORKING IMPORTANT STUFF //
// ///////////////////////// //
var server_connection = null;
var our_playerid = null;
var client_players = [];
function return_player_from_id(target_id){
    for (j = 0; j < client_players.length; j++){
        if (client_players[j].id == target_id)
        return client_players[j];
    }
    return null;
}
function initialize_player_colors(player){

}

var chatbox_field_text = document.getElementById("chatbox_field");
function recieved_packet_from_server(data){
    if (data.type == undefined) {
        console.log("Received non defined data: ", data);
    }
    else if (data.type == SERVER_confirm_sqiggle){
        if (connection_state != 2){
            console.log("attemtped server confirmation, we are not ready for that"); return;
        }
        if (data.content != "Welcome!"){
            console.log("Anomalous connection confirmed message"); return;
        }
        connection_state = 3;
        connecting_status_text.innerHTML = "enter your playerinfo";
        server_code_form.style.visibility = "collapse";
        server_pinfo_form.style.visibility = "visible"; // allow players to now enter their info
    }
    else if (data.type == SERVER_join_failure){
        if (connection_state != 3){
            console.log("server failed our playerinfo, however we didn't submit just then"); return;
        }
        connecting_status_text.innerHTML = "playerinfo rejected, try again, reason: " + data.content;
        server_pinfo_form.style.visibility = "visible"; // allow players to now enter their info
    }
    else if (data.type == SERVER_init_player){
        if (connection_state != 3){
            console.log("being sent init data, we weren't waiting for any"); return;
        }
        connection_state = 4; // ok now we're loaded
        // apparently these do not hide automatically, despite being the children of those elements
        server_code_form.style.visibility = "collapse";
        server_pinfo_form.style.visibility = "collapse"; 
        // update UI to be ingame
        document.getElementById("session_ui").style.visibility = "visible";
        document.getElementById("joining_ui").style.visibility = "collapse";
        // inhale the initilization data
        our_playerid = data.content.id;
        for (let j = 0; j < data.content.players.length; j++){
            load_player(data.content.players[j]);
        }
        // ok now load the game up i guess
        initialize(data.content.seed);
    }
    else if (data.type == SERVER_new_player){
        load_player(data.content);
    }
    else if (data.type == SERVER_message){
        let sender_player = return_player_from_id(data.content.user_id);
        UI_add_message(data.content.text, sender_player.color);
    }
    else if (data.type == SERVER_time_update){
        update_time(data.content.turn_time, data.content.action_time);
    }
    else if (data.type == SERVER_request_moves){
        server_connection.send({type: CLIENT_submit_moves, content: return_action_queue_and_cleanup()});
        enable_action_mode();
    }
    else if (data.type == SERVER_sendback_moves){
        has_recieved_actions = true;
        // call that function  whatever it is
        actions_to_commit = data.content;
    }
    else{
        console.log("recieved invalid packet type: " + data.type); 
    }
}
function client_error(err){
    console.log("client connection experienced error:\n"+err);
    abort_connection(err);
}
function server_error(err){
    console.log("connection to server experienced error:\n"+err);
    abort_connection(err);
}

var playerlist_box = document.getElementById("playernames_field");
function load_player(player_object){
    client_players.push(player_object);
    UI_addplayer(player_object.name, player_object.id, player_object.color);
    setup_player_colors(player_object);
}



function abort_connection(abort_reason){
    if (connection_state >= 4) {
        // they have to refresh the page, too much data to fixup
    }
    connection_state = 0
    // clear entered code
    server_code_text.value = "";
    // notify user that connection experieinced error
    connecting_status_text.innerHTML = "connection failed: " + abort_reason;

    server_code_form.style.visibility = "visible";
    server_pinfo_form.style.visibility = "collapse";
    // update UI to be in menu
    document.getElementById("session_ui").style.visibility = "collapse";
    document.getElementById("joining_ui").style.visibility = "visible";
    // disconnect from server?
    // cancel that, idk what the heck the documentation means, just blow everything up
    //server_connection.destroy();
    client.destroy();
    // im pretty sure this would disrupt the destruction process but whatever
    server_connection = null;
    client = null;
}

// ////////////////////////// //
// NETWORKING INITIALIZATION //
// //////////////////////// //
var connecting_status_text = document.getElementById("status_field");

var server_code_form = document.getElementById("join_session_form");
var server_code_text = document.getElementById("join_code_field");

var server_pinfo_form = document.getElementById("player_info_form");
var server_pinfo_name = document.getElementById("join_name_field");
var server_pinfo_color = document.getElementById("join_color_field");

var client = null;
var server_code = null;
var connection_state = 0;
// 0: not connected
// 1: client established
// 2: confirming sqiggle server
// 3: awaiting userinfo
// 4: 

function attempt_to_connect_to_server(){
    server_code = server_code_text.value;
    if (connection_state > 0 && server_connection == null){ // make sure we aren't in the middle of trying to connect
        connecting_status_text.innerHTML = "reattempting connection...";
        connect_client_to_server();
        return;
    }
    if (client != null) return;
    connecting_status_text.innerHTML = "establishing client";
    client = new Peer();
    client.on('error', client_error);
    client.on("open", (id) => {
        console.log("Client loaded, My peer ID is: " + id);
        connecting_status_text.innerHTML = "client established, connecting...";
        connection_state = 1;
        connect_client_to_server();
});}
function connect_client_to_server(){
    try{server_connection = client.connect(server_code);
        server_connection.on('error', server_error);
    }catch{
        connecting_status_text.innerHTML = "failed to connect";
        server_connection = null;
    }
    server_connection.on("data", recieved_packet_from_server);
    // on open will be launch when you successfully connect to PeerServer
    server_connection.on('open', function(){
        // here you have conn.id
        connecting_status_text.innerHTML = "connected, confirming connection";
        server_connection.send({type:CLIENT_test_sqiggle, content:"Hello!"})

        console.log("successfully opened connection to server")
        connection_state = 2;
    });
}
function submit_playerinfos(){
    if (connection_state != 3){
        console.log("somehow skipped connection, trying to send playerinfo")
        return;
    }
    // hide this ui for a quick sec, so you cant spam press
    server_pinfo_form.style.visibility = "colapse";
    connecting_status_text.innerHTML = "submitting userinfo...";
    server_connection.send({type:CLIENT_joining, content:{name:server_pinfo_name.value, color:server_pinfo_color.value}})
}

// /////////////////////////////// //
// SENDING MESSAGES TO THE SERVER //
// ///////////////////////////// //

function send_message_as_client(){
    server_connection.send({type: CLIENT_user_message, content: messagebox_text.value});
    messagebox_text.value = "";  // clear text input
    // we dont do any other fancy stuff as the message will be sent back to us shortly
}