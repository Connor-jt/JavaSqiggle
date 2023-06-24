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




// TODO LATER


// need some stuff for handling when a unit either moves into our view
// or when a unit attacks into our view and then fades back out of it
// i imagine that will not be the eaisest to make apparent
// as the attack animations are already rather quick

// ///////////////////// //
// INITIALIZATION LOGIC //
// /////////////////// //
//initialize();


var scene;
var renderer;
var camera;
var controls;

var timer_text = document.getElementById("timer");
var timer_box = document.getElementById("hud");
var messagebox_text = document.getElementById("client_message_field");

var money_text = document.getElementById("currency");
var expenses_text = document.getElementById("used_currency");

function initialize(map_seed){
    // clear the background image so we can see the 3d renderer
    var background_image = document.getElementById("spash_screen_image");
    background_image.parentNode.removeChild(background_image);

    let seed_gen = get_rand_func(map_seed);
    let seed_gen2 = get_rand_func('_' + map_seed); // THIS WILL be removed, and fixed at a later date

    lesser_noise2D = createNoise2D(seed_gen);
    greater_noise2D = createNoise2D(seed_gen2);

    scene = new THREE.Scene();
    // grid visual // REMOVE
    scene.add(new THREE.GridHelper(2, 2));
    // /////////////////////////// //
    // SETUP DIRECTIONAL LIGHTING //
    // ///////////////////////// //
    const light_color = 0xFFFFFF;
    const light_intensity = 0.80;
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
    renderer.setClearColor(0x702020, 1);
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
    window.addEventListener("keydown", client_keydown);
    window.addEventListener("keyup", client_keyup);
    window.addEventListener( 'pointermove', onPointerMove );
    // ///////////////// //
    // SETUP GAME BOARD // 
    // /////////////// //
    // screw this maths junk HOLY MOLY
    // why did this take me well over 6 hours just to get a board working????? god bless javascript & three.js
    // tile count x & y have to be equal 3:4 ratio, also needs to be an odd number else the rows are offset
    const tile_count_x = 1503;
    const tile_count_y = 2004;
    const board_width_x = (tile_count_x * 1.73205);
    const board_width_Y = (tile_count_y * 1.5);

    const plan_geometry = new THREE.PlaneGeometry(board_width_x, board_width_Y);
    new THREE.TextureLoader().load(board_texture_64, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const repeat_X = tile_count_x/3;
        //const repeat_Y = repeat_X * 1.151801487592027; // square ratio based
        const repeat_Y = tile_count_y/4;
        texture.repeat.set(repeat_Y, repeat_X);
        /*texture.offset.set(xOffset, yOffset);*/
        let test_mesh = new THREE.Mesh(plan_geometry, new THREE.MeshBasicMaterial({map: texture}))
        test_mesh.rotateX(-1.570796);
        //test_mesh.position.set(0, -0.5, 0);
        scene.add(test_mesh);
    }, undefined, (err) =>{
		console.log( 'Error loading board image.' + err);
    });
    // make the camera move to a valid position
    move_camera_to_coords([0,0]);
    // setup shop prices
    update_unit_counts();

    animate();
}

// /////////////////// //
// UNIT RUNTIME LOGIC //
// ///////////////// //
var currently_selected_unit = null;
var onscreen_units = {};
var queued_discover_units = {};
var client_objectives = {}; // pos: is_controlled:
function client_create_objetive(pos_){
    let objective_pos_str = pos_[0] +','+ pos_[1];
    client_objectives[objective_pos_str] = {pos: pos_, is_controlled: false};
    discover_units_from_list(create_tile_circle(pos_[0],pos_[1], 2, queued_discover_units));
    // test whether a unit is already on the tile
    let unit_test = onscreen_units[objective_pos_str];
    update_objective(pos_, unit_test);
}
function update_objective(pos, unit){
    // here we neeed to get the color of the unit, or if null then use the default color
    let c_objectiove = client_objectives[pos[0]+','+pos[1]];
    if (c_objectiove == null){
        console.log("referenced objective does not exist");
        return;
    }
    if (unit == null) {
        create_objective_tile_circle(pos[0], pos[1], 1, null)
        c_objectiove.is_controlled = false;
    }else{ 
        create_objective_tile_circle(pos[0], pos[1], 1, return_player_from_id(unit.owner))
        c_objectiove.is_controlled = true;
}}
function check_if_causes_objective_update(unit, is_leaving){
    if (client_objectives[unit.pos[0]+','+unit.pos[1]] != null){
        if (is_leaving) {
            update_objective(unit.pos, null);
        } else {
            update_objective(unit.pos, unit);
}}}

var money = 0;
var expenses = 0;
var has_workers_left = null; // need to update this everytime a unit is destroyed or created

var is_auto_attacking = false;
// inital as null so it has neither state when we start the match (we will call it on init)
function apply_purchase(target_unit){
    let unit_cost = match_unit_type_to_price(target_unit.type);
    apply_expense(target_unit.type, true);
    update_money_counter(money - unit_cost);
}
function update_money_counter(new_value){
    money = new_value;
    money_text.innerText = "$" + money;
}
function apply_expense(unit_type, is_detraction){
    let unit_cost = match_unit_type_to_price(unit_type);

    if (is_detraction) unit_cost *= -1;
    update_expenses_counter(expenses + unit_cost);
}
function update_expenses_counter(new_value){
    expenses = new_value;
    if (new_value <= 0){ // no expense
        expenses_text.innerText = "";
    }
    else { // visual expense
        expenses_text.innerText = "-" + expenses;
    }
}
function match_unit_type_to_price(unit_type){
    if (has_workers_left){ // according to this logic we must only ever update worker count after action mode is disabled
        if      (unit_type == unit_worker)  return worker_cost;
        else if (unit_type == unit_soldier) return soldier_cost;
        else if (unit_type == unit_sniper)  return sniper_cost;
        else if (unit_type == unit_tower)   return tower_cost;
    } else {
        if      (unit_type == unit_worker)  return worker_resort_cost;
        else if (unit_type == unit_soldier) return soldier_resort_cost;
        else if (unit_type == unit_sniper)  return sniper_resort_cost;
        else if (unit_type == unit_tower)   return tower_resort_cost;
    }
    return 0; // this should never occur
}

const regular_price_tile_color = "#373737ff";
const resort_price_tile_color = "#37373740";

const regular_price_color = "#c0c0c0";
const resort_price_color = "#ffa0a0";
function update_unit_counts(){
    // count the workers
    let workers = 0;
    let friendlies = 0;
    let enemies = 0;
    for (let key in onscreen_units){
        let curr_unit = onscreen_units[key];
        // friendly or not
        if (curr_unit.owner == our_playerid){
            friendlies += 1;
            if (curr_unit.type == unit_worker){
                workers += 1;
        }}else { // eneny
            enemies += 1;
    }}
    // update the unit count displays
    document.getElementById("friendly_counter").innerHTML = "" + friendlies;
    document.getElementById("enemy_counter").innerHTML = "" + enemies;
    // then update the workers left
    if (workers == 0){ // none left
        if (has_workers_left != false){ // then we need to update the UI for resort prices
            // UI update text colors
            document.getElementById("store").style["color"] = resort_price_color;
            // UI update costs
            document.getElementById("worker_price").innerHTML = "$" + worker_resort_cost;
            document.getElementById("soldier_price").innerHTML = "$" + soldier_resort_cost;
            document.getElementById("sniper_price").innerHTML = "$" + sniper_resort_cost;
            document.getElementById("tower_price").innerHTML = "$" + tower_resort_cost;
        }
        has_workers_left = false;
    } else { // has workers left
        if (has_workers_left != true){ // then we need to update the UI for regular prices
            // UI update text colors
            document.getElementById("store").style["color"] = regular_price_color;
            // UI update
            document.getElementById("worker_price").innerHTML = "$" + worker_cost;
            document.getElementById("soldier_price").innerHTML = "$" + soldier_cost;
            document.getElementById("sniper_price").innerHTML = "$" + sniper_cost;
            document.getElementById("tower_price").innerHTML = "$" + tower_cost;
        }
        has_workers_left = true;
    }
}

function get_client_unit_by_id(unit_id){
    for (let unit in onscreen_units){
        if (onscreen_units[unit].unit_id == unit_id) {
            return onscreen_units[unit];
    }}
    return null;
}
function get_client_unit_KEY_by_id(unit_id){
    for (let unit in onscreen_units){
        if (onscreen_units[unit].unit_id == unit_id) {
            return unit;
    }}
    console.log("failed to find unit key for deletion, critical errors may ensue")
    return null;
}
function does_unit_exist_at(x, y){
    let current_coords = x + ',' + y;
    let unit = onscreen_units[current_coords];
    return (unit != null);
}
function unit_see(unit, last_position){
    // return a list of units to create, typically it will be none
    discover_units_from_list(create_tile_circle(unit.pos[0],unit.pos[1], unit.vision_range, queued_discover_units));
    move_camera_to_coords(unit.pos);
    
    // this is used to clear tiles that were previously seen, if not done correctly this tiles will still be there if no units have vision here
    if (last_position != null){
        unit_stop_seeing(unit, last_position);
    }
}
function discover_units_from_list(units_to_create){
    for (let j = 0; j < units_to_create.length; j++){
        let unit_coord_str = units_to_create[j];
        let discover_action = queued_discover_units[unit_coord_str];
        if (discover_action != null){
            console.log("unit discovered at: " + unit_coord_str);
            delete queued_discover_units[unit_coord_str]; // clear this one out, as we've just spawned it in
            create_piece_at_and_wrap(discover_action.unit, discover_action.unit_id, discover_action.pos, discover_action.player_id);
        }else{
            console.log("tried to discover unit that couldn't be found");
    }}
}
function unit_stop_seeing(unit, position){
    let last_position = unit.pos;
    if (position != null){
        last_position = position;
    }
    // clear the assigned terrain pieces at the last location
    // return list of units to delete
    let units_to_del = delete_tile_circle(last_position[0],last_position[1], unit.vision_range, onscreen_units);
    for (let j = 0; j < units_to_del.length; j++){
        let unit_object = onscreen_units[units_to_del[j]];
        if (unit_object != null){
            if (unit != unit_object){            
                delete_unit(unit_object);
            } else{
                console.log("attemtped to delete unit that we own, early");
            }
        }else{
            console.log("instructed to delete unit that does not exist");
}}}
// NEVER RUN ANY OF THESE IN ACTION MODE
function unit_set_roam_mode(unit){
    clear_units_prev_queued_move(unit);
    unit_clear_mode(unit);
    unit.mode = umode_roam;
    unit_mode_run(unit); // destination will be calculated in here
    unit_update_mode_ui(unit);
}
function unit_set_aggressive_mode(unit){
    clear_units_prev_queued_move(unit);
    unit_clear_mode(unit);
    unit.mode = umode_aggressive;
    unit_mode_run(unit); // destination will be calculated in here
    unit_update_mode_ui(unit);
}
function unit_set_follow_mode(unit, target){
    clear_units_prev_queued_move(unit);
    unit_clear_mode(unit);
    unit.mode = umode_follow;
    unit.target_id = target.unit_id;
    unit_mode_run(unit);
    unit_update_mode_ui(unit);
}
function unit_set_destination_mode(unit, dest_arr){
    clear_units_prev_queued_move(unit);
    unit_clear_mode(unit);
    unit.mode = umode_destination;
    unit.dest = dest_arr;
    unit_mode_run(unit);
    unit_update_mode_ui(unit);
}
function unit_clear_mode(unit){
    unit.mode = umode_none;
    unit.target_id = null;
    unit.dest = null;
    unit_hide_objective(unit);
}
function unit_set_default_mode(unit){ // aka cancel
    unit_clear_mode(unit);
    unit_update_mode_ui(unit);
}

const enabled_source = "resources/units_panel/active_48.png";
const disabled_source = "resources/units_panel/inactive_48.png";
function unit_update_mode_ui(unit){
    // let it be known that the modes are active (aka full transparency)
    document.getElementById("sr_mode_default").style["background-color"] = regular_price_tile_color;
    document.getElementById("sr_mode_roam").style["background-color"] = regular_price_tile_color;
    document.getElementById("sr_mode_aggressive").style["background-color"] = regular_price_tile_color;
    document.getElementById("sr_mode_follow").style["background-color"] = regular_price_tile_color;
    document.getElementById("sr_mode_destination").style["background-color"] = regular_price_tile_color;
    // then toggle all the states accordingly
    let none_mode_img =         document.getElementById("sr_mode_default_img");
    let roam_mode_img =         document.getElementById("sr_mode_roam_img");
    let aggressive_mode_img =   document.getElementById("sr_mode_aggressive_img");
    let follow_mode_img =       document.getElementById("sr_mode_follow_img");
    let destination_mode_img =  document.getElementById("sr_mode_destination_img");
    none_mode_img.src = disabled_source;
    roam_mode_img.src = disabled_source;
    aggressive_mode_img.src = disabled_source;
    follow_mode_img.src = disabled_source;
    destination_mode_img.src = disabled_source;
    if (unit.mode == umode_none){
        none_mode_img.src = enabled_source;
    } else if (unit.mode == umode_roam){
        roam_mode_img.src = enabled_source;
    } else if (unit.mode == umode_aggressive){
        aggressive_mode_img.src = enabled_source;
    } else if (unit.mode == umode_follow){
        follow_mode_img.src = enabled_source;
    } else if (unit.mode == umode_destination){
        destination_mode_img.src = enabled_source;
}}
function unit_mode_run(unit){
    // if we aren't in a special mode or auto attack, skip so we dont create a tile list each time
    if (unit.mode == umode_none && !is_auto_attacking) return;
    // first cancel the previously allocated move
    clear_units_prev_queued_move(unit); // i feel like it might be a bad idea to constantly unqueue moves each turn start
    // create this once, and not for each of those things, then parse the list into those functions
    let tiles_list = list_all_tiles_in_unit_range(unit.pos[0], unit.pos[1], unit.attack_range, unit.move_range, onscreen_units);
    // we also want to check if we have auto attacks on
    if (is_auto_attacking){
        let in_range_target = unit_auto_attack(unit, tiles_list);
        if (in_range_target != null){
            QUEUE_attack_piece(unit, in_range_target);
            return;
    }}
    // and if so, then apply the auto attack move, instead of running them mode move
    if (unit.mode == umode_none) return;
    if (unit.mode == umode_roam){
        unit_mode_run_roam(unit, tiles_list);
    } else if (unit.mode == umode_aggressive){
        unit_mode_run_aggressive(unit, tiles_list);
    } else if (unit.mode == umode_follow){
        unit_mode_run_follow(unit, tiles_list);
    } else if (unit.mode == umode_destination){
        unit_mode_run_destination(unit, tiles_list);
}}
function unit_auto_attack(grunit, tiles_list){
    let unit_pos_of = get_location_offset(grunit.pos[0], grunit.pos[1]);
    let closest_enemy = null;
    let distan = null;
    let looking_for_health_target = true;
    for (let key in tiles_list.unit){
        let curr_unit = onscreen_units[key];
        if (curr_unit == null){ // i dont think this will ever happen
            console.log("unit said to be on tile but not found: " + tiles_list.unit[key])
        }else if (curr_unit.owner != our_playerid){
            let target_pos_off = get_location_offset(curr_unit.pos[0], curr_unit.pos[1]);
            // measure the distance between unit and target
            let _dist = distance_between_points(unit_pos_of, target_pos_off); 
            if (distan == null || _dist < distan || looking_for_health_target){
                if (looking_for_health_target || curr_unit.calculated_damage < curr_unit.defense){
                    if (curr_unit.calculated_damage < curr_unit.defense){
                        looking_for_health_target = false;
                    }
                    distan = _dist;
                    closest_enemy = curr_unit;
                    curr_unit.calculated_damage += grunit.attack;
    }}}} 
    return closest_enemy; 
}

// MAKE SURE ALL OF THESE STORE THE OUTPUT DEST VALUE, SO WE CAN SEE WHERE THEY ARE GOING
const roam_outter_dist = 10;
const roam_min_dist = 3;
function unit_mode_run_roam(unit, tiles){
    // basically calculate a random point for this unit to go to and apply destination mode
    if (unit.dest != null){
        if (unit.pos[0] == unit.dest[0] && unit.pos[1] == unit.dest[1]){
            unit.dest = null; //location reached, next location
    }}
    if (unit.dest == null){
        // then find a new target position with rand numbers
        let x_offset = (roam_min_dist + Math.floor(Math.random() * roam_outter_dist)) * ((Math.floor(Math.random()*2)*2)-1);
        let y_offset = (roam_min_dist + Math.floor(Math.random() * roam_outter_dist)) * ((Math.floor(Math.random()*2)*2)-1);
        unit.dest = [unit.pos[0]+x_offset, unit.pos[1]+y_offset];
    }
    // then queue the move to action
    let closest_tile = return_closest_reachable_tile(unit, tiles, null);
    if (closest_tile != null) {
        if (closest_tile === true){ // reached destination, we'll set a new one next time
            QUEUE_move_piece(unit, unit.dest); 
        }else if (closest_tile === false){ // this shouldn't happen as we'll check before to see if we're on the spot
            console.log("somehow we are already on the tile that we're supposed to go to (roam)");
            unit.dest = null;
        }else { // then we actually found a tile
            QUEUE_move_piece(unit, closest_tile); 
}}}
function unit_mode_run_aggressive(unit, tiles){
    // check whether any units are onscreen, if there are chase them
    // if none go for objectives // NOT IMPLEMENTED YET

    // we actually want the units to constantly chase the closest units
    // let targ_unit = get_client_unit_by_id(unit.target_id);
    unit.target_id = null; // for bugs sake, this probably fixes something
    let is_attacking = false;
    let unit_pos_off = get_location_offset(unit.pos[0], unit.pos[1]);

    let closest_length = null;

    let closest_unit = null;
    for (let key in onscreen_units){
        let curr_unit = onscreen_units[key];
        if (curr_unit.owner != our_playerid){
            let target_pos_off = get_location_offset(curr_unit.pos[0], curr_unit.pos[1]);
            // measure the distance between unit and dest
            let unit_dist = distance_between_points(unit_pos_off, target_pos_off); 
            if (closest_length == null || unit_dist < closest_length){
                closest_length = unit_dist;
                closest_unit = curr_unit;
    }}}
    // now meaure distances to objectives
    let closest_ob = null;
    for (let key in client_objectives){
        let cobjective = client_objectives[key].pos;
        if (cobjective.is_controlled) continue;

        let ob_pos_off = get_location_offset(cobjective.pos[0], cobjective.pos[1]);
        // measure the distance between unit and dest
        let ob_dist = distance_between_points(unit_pos_off, ob_pos_off); 
        if (closest_length == null || ob_dist < closest_length){
            closest_length = ob_dist;
            closest_ob = cobjective.pos;
    }}
    // then determine which mode to enter (attack/objective/none)
    if (closest_ob != null){ // objective mode
        unit.dest = closest_ob.slice(0);
    } else if (closest_unit != null){ // attack mode
        unit.dest = closest_unit.pos.slice(0);
        unit.target_id = closest_unit.unit_id;
        is_attacking = true;
    } else { // none mode
        return; // if no objective was found, dont do anything?
    }

    // determine if we are moving somewhere or attack-chasing
    let closest_tile = null;
    if (is_attacking){ //  enemy
        closest_tile = return_closest_reachable_tile(unit, tiles, closest_unit);
    } else { // objective
        closest_tile = return_closest_reachable_tile(unit, tiles, null);
    }

    if (closest_tile != null) {
        if (closest_tile === true){
            if (is_attacking){
                QUEUE_attack_piece(unit, closest_unit);
            } else {
                QUEUE_move_piece(unit, unit.dest); // this theoretically moves us exactly to objective point
        }}else if (closest_tile === false){
            // ideally, we're on the objective and we dont need to move
            unit_set_default_mode(unit);
        }else { // then we actually found a tile
            QUEUE_move_piece(unit, closest_tile); // we don need to try as we already know we can move here
}}}
function unit_mode_run_follow(unit, tiles){
    // if the unit no longer exist, exit follow mode
    let targ_unit = get_client_unit_by_id(unit.target_id);
    if (targ_unit == null){ // then the target has died or stopped existing
        unit_set_default_mode(unit);
        return;
    } else { // they're still up, grab their latest destination
        unit.dest = targ_unit.pos.slice(0);
    }
    // determine if we are following or attack-chasing
    let closest_tile = null;
    let is_attacking = false;
    if (targ_unit.owner == our_playerid){ // friendly
        closest_tile = return_closest_reachable_tile(unit, tiles, null);
    } else { // enemy
        closest_tile = return_closest_reachable_tile(unit, tiles, targ_unit);
        is_attacking = true;
    }
    
    if (closest_tile != null) {
        if (closest_tile === true){
            if (is_attacking){
                QUEUE_attack_piece(unit, targ_unit);
            } else {
                console.log("how are we following someone and we got to the same tile as them????")
                QUEUE_move_piece(unit, unit.dest); // we also dont need to try as we checked to make sure nothing was here
        }}else if (closest_tile === false){
            console.log("somehow we are already on the tile that we're supposed to go to (follow)");
        }else { // then we actually found a tile
            QUEUE_move_piece(unit, closest_tile); // we don need to try as we already know we can move here
}}}
function unit_mode_run_destination(unit, tiles){
    // simply schedule the next closest move towards the dest
    // if the dest is within range, revert to regular mode UNLESS its blocked, then queue next closest
    let closest_tile = return_closest_reachable_tile(unit, tiles, null);
    if (closest_tile != null) {
        if (closest_tile === true){
            // dest reached, clear mode
            QUEUE_move_piece(unit, unit.dest); // we also dont need to try as we checked to make sure nothing was here
            unit_set_default_mode(unit);
        }else if (closest_tile === false){
            console.log("somehow we are already on the tile that we're supposed to go to (destination)");
            unit_set_default_mode(unit);
        }else{// then we actually found a tile
        QUEUE_move_piece(unit, closest_tile); // we don need to try as we already know we can move here
}}}
function return_closest_reachable_tile(unit, tiles, target){ // target = attacking mode
    // first test whether we can just reach the destination (both move and attack wise)
    if (target != null){
        if (tiles.unit[target.pos[0] +','+ target.pos[1]] != null){
            return true;
    }}else if (tiles.move[unit.dest[0] +','+ unit.dest[1]] != null){
        if (!test_whether_pos_is_occupied(unit.dest))
            return true;
    }
    // check to make sure we aren't already where we're trying to be
    if (unit.pos[0] == unit.dest[0] && unit.pos[1] == unit.dest[1]) return false;

    // if the move wasn't found to be immediately reachable, then find the next best tile to go to
    // get the real world distance of the destination
    let dest_pos_off = get_location_offset(unit.dest[0], unit.dest[1])

    let closest_length = null;
    let closest_key = null;
    for (let j in tiles.move){
        let curr_tile_arr = tiles.move[j]; 
        if (test_whether_pos_is_occupied(curr_tile_arr)) continue; // we cant move here so dont bother
        // find the real world position of this tile
        let tile_pos_off = get_location_offset(curr_tile_arr[0], curr_tile_arr[1]);
        // measure the distance between tile and dest
        let dest_dist = distance_between_points(dest_pos_off, tile_pos_off); 
        if (closest_length == null || dest_dist < closest_length){
            closest_length = dest_dist;
            closest_key = j;
    }}
    if (closest_key == null){ // then we did not find a single viable tile somehow?
        return null;
    }
    return tiles.move[closest_key]; // (an array) we could actually pass back the key, because we could just use that to have both values
}
function distance_between_points(p1, p2){
    return Math.sqrt((Math.pow(p2[0]-p1[0],2))+(Math.pow(p2[1]-p1[1],2)));
}


function unit_show_objective(unit){
    unit_hide_objective(unit); // clear first just in case
    if (unit.mode != umode_none && unit.dest != null){
        unit.dest_highlight = preview_hightlight_tile(unit.dest[0], unit.dest[1], preview_objective);
    }
}
function unit_hide_objective(unit){
    if (unit.dest_highlight != null){
        scene.remove(unit.dest_highlight);
        unit.dest_highlight = null;
    }
}


function select_unit(selec_unit){
    deselect_unit();
    if (selec_unit.owner != our_playerid) return; // do not select units that we dont own
    currently_selected_unit = selec_unit;
    move_camera_to_coords(currently_selected_unit.pos);
    // TODO: UPDATE THIS TO USE UNIT COORDS
    preview_moves_at(selec_unit.pos[0], selec_unit.pos[1], currently_selected_unit.attack_range, currently_selected_unit.move_range, onscreen_units);
    // we also need to display any highgluight moves that this unit muight have
    unit_show_objective(selec_unit);
    // aka objective moves
    unit_update_mode_ui(selec_unit);
}
function select_unit_at(position_Array){
    let current_coords = position_Array[0] + ',' + position_Array[1];
    let unit = onscreen_units[current_coords];
    if (unit != null){
        select_unit(unit);
    }
}
function deselect_unit(){
    if (currently_selected_unit == null) return;
    unit_hide_objective(currently_selected_unit);
    currently_selected_unit = null;
    preview_clear_moves();
    // disable visual for each
    document.getElementById("sr_mode_default").style["background-color"] = resort_price_tile_color;
    document.getElementById("sr_mode_roam").style["background-color"] = resort_price_tile_color;
    document.getElementById("sr_mode_aggressive").style["background-color"] = resort_price_tile_color;
    document.getElementById("sr_mode_follow").style["background-color"] = resort_price_tile_color;
    document.getElementById("sr_mode_destination").style["background-color"] = resort_price_tile_color;
    // disable indicators for each
    document.getElementById("sr_mode_default_img").src = disabled_source;
    document.getElementById("sr_mode_roam_img").src = disabled_source;
    document.getElementById("sr_mode_aggressive_img").src = disabled_source;
    document.getElementById("sr_mode_follow_img").src = disabled_source;
    document.getElementById("sr_mode_destination_img").src = disabled_source;
    
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
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
    controls.update();

    // check to see if any visual ui needs updating
    update_hovered_stuff();

    animate_move_fail_indicators();
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
var failed_moves = [];
/* sample: {
    mesh:
    progress:
}*/
const fail_indicator_mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const fail_indicator_height = 0.8;
const fail_indicator_scale = 0.65;
const fail_indicator_shrink_rate = 0.01;
function animate_move_fail_indicators(){
    for (let j = 0; j < failed_moves.length; j++){
        let curr_obj = failed_moves[j];
        curr_obj.progress -= fail_indicator_shrink_rate;
        if (curr_obj.progress <= 0.0){
            // cleanup
            scene.remove(curr_obj.mesh);
            failed_moves.splice(j, 1);
            j--;
            console.log("completed failed move indicator");
            continue;
        }
        // else just continue scaling down
        curr_obj.mesh.scale.set(curr_obj.progress,curr_obj.progress,curr_obj.progress);
}}
function create_fail_indicator(vector_pos){
    let test_mesh = new THREE.Mesh(mesh_geo, fail_indicator_mat)
    scene.add(test_mesh);
    failed_moves.push({mesh:test_mesh, progress:fail_indicator_scale});
    let new_vec = vector_pos.clone();
    new_vec.y += fail_indicator_height;
    // then assign it to the correct position
    // let pos__off = get_location_offset(pos[0], pos[1]);
    test_mesh.position.copy(new_vec); // new THREE.Vector3(pos__off[0], find_visual_hieght_at(pos[0]+","+pos[1], pos__off[0], pos__off[1]), pos__off[1]);
}

var current_action = null;
var action_speed = 1.0;
// need to have something that essentially breaks the flow if theres an action like moving or attacking
function commit_next_action(){
    if (stackions_to_commit == undefined) return;
    let next_action = get_next_action_to_commit();
    if (next_action == null) { // then see if theres any more to go
        stackions_to_commit.splice(0, 1); // knock the first stack off the block
        return; // better to let it queue to the next frame then to do some recursion?
    }
    if (stackions_to_commit.length == 0){
        disable_action_mode(); // if null, then there are no more actions to process
        return;
    }
    
    else if (next_action.type == create_unit)        create_piece(next_action);
    else if (next_action.type == move_unit)          move_piece(next_action);
    else if (next_action.type == create_move_unit)   move_piece(next_action);
    else if (next_action.type == attack_unit)        attack_piece(next_action);
    else if (next_action.type == create_attack_unit) create_attack_piece(next_action);
    else if (next_action.type == blind_attack_unit)  blind_attack_piece(next_action);
    else if (next_action.type == destroy_unit)       action_destroy_piece(next_action);
}
var action_phase = 0;
const committing_attack_actions  = 0;
const committing_move_actions    = 1;
const committing_create_actions  = 2;
const committing_destroy_actions = 3;
// step processing code, do all actions in this order: attacks -> moves -> creations
function get_next_action_to_commit(){
    if (stackions_to_commit.length == 0){
        console.log("we shouldn't hit this, no stackions during check for next action")
        return null;
    }
    // attack block 
    if (action_phase == committing_attack_actions){
        for (let j = 0; j < stackions_to_commit[0].length; j++){
            if (stackions_to_commit[0][j].type == attack_unit || stackions_to_commit[0][j].type == create_attack_unit || stackions_to_commit[0][j].type == blind_attack_unit){
                return load_action(j);
    }} action_phase = committing_move_actions; }
    // move block
    if (action_phase == committing_move_actions){
        for (let j = 0; j < stackions_to_commit[0].length; j++){
            if (stackions_to_commit[0][j].type == move_unit || stackions_to_commit[0][j].type == create_move_unit){
                return load_action(j);
    }} action_phase = committing_create_actions; }
    // create block
    if (action_phase == committing_create_actions){
        for (let j = 0; j < stackions_to_commit[0].length; j++){
            if (stackions_to_commit[0][j].type == create_unit ){
                return load_action(j);
    }} action_phase = committing_destroy_actions; }
    // destroy block
    for (let j = 0; j < stackions_to_commit[0].length; j++){
        if (stackions_to_commit[0][j].type == destroy_unit ){
            return load_action(j);
    }}
    // else return blank and cancel action mode, as theres no more actions to process
    return null;
}
function load_action(j){
    let result = stackions_to_commit[0][j];
    stackions_to_commit[0].splice(j, 1);
    return result;
}

function progress_current_action(){
    if      (current_action.type == create_unit)   PROGRESS_create_piece();
    else if (current_action.type == move_unit)     PROGRESS_move_piece();
    else if (current_action.type == attack_unit)   PROGRESS_attack_piece();
    else if (current_action.type == destroy_unit)  PROGRESS_destroy_piece(); // yes we now animate destroy events
    else    current_action = null;
}
function move_piece(action){
    // we could probably do this after the piece moves, that would probably look nicer
    let target_unit;
    if (action.type == move_unit){
        target_unit = get_client_unit_by_id(action.unit_id);
        if (target_unit == null){
            console.log("[CLIENT] recieved move instruction for unit_id that has no matching unit");
            return;
        }   
        delete onscreen_units[target_unit.pos[0]+","+target_unit.pos[1]];
    }
    else{ // 'create_move_unit'
        target_unit = create_piece_at(action.unit, action.unit_id, action.og_pos, action.player_id);
        target_unit.defense = action.health; // update the health accordingly
    }
    check_if_causes_objective_update(target_unit, true);

    let old_pos = [target_unit.pos[0], target_unit.pos[1]];
    // update the position on this unit

    onscreen_units[action.pos[0] + ',' + action.pos[1]] = target_unit;
    target_unit.pos = action.pos;
    let new_position_str = target_unit.pos[0]+","+target_unit.pos[1];

    if (target_unit.owner == our_playerid){
        // render the new area for this piece
        unit_see(target_unit, old_pos);
    }
    // also we need to double check if they just left the objective\

    // now log all the data so we can animate
    // get the final destination real world position
    let pos_off = get_location_offset(target_unit.pos[0], target_unit.pos[1]);
    let action_tile_height = find_visual_hieght_at(new_position_str, pos_off[0], pos_off[1]);
    
    let dest_pos = new THREE.Vector3(pos_off[0], action_tile_height, pos_off[1]);
    let difference = dest_pos.clone().sub(target_unit.mesh.position);
    current_action = { type: move_unit, unit: target_unit, 
        destination: dest_pos,
        difference: difference,
        offset: 0.0,
    };
}
const movement_speed = 0.028;
const jump_height = 4.5;
const jump_curve = 2.8;
function PROGRESS_move_piece(){
    current_action.offset += movement_speed*action_speed;
    // check if we've now completed the movement, if so, end this action 
    if (current_action.offset >= 1){
        // cleanup the highlight
        clear_unit_highlights(current_action.unit);
        current_action.unit.mesh.position.copy(current_action.destination);
        // verify if they now hold an objective
        check_if_causes_objective_update(current_action.unit, false);
        // now test to see if they stopped being visible
        let final_pos_str = current_action.unit.pos[0] + ',' + current_action.unit.pos[1];
        if (instanced_tiles[final_pos_str] == null){
            // then this unit went somewhere that is not visible aka they escaped vision, thus delete
            delete_unit(current_action.unit);
        }

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
        console.log("[CLIENT] recieved instruction to attack piece that does not exist");
        return;
    }

    let dest = calculate_realworld_position_of(target_unit);
    let origin = calculate_realworld_position_of(attacker_unit);
    current_action = { type: attack_unit, unit: attacker_unit, target: target_unit,
        destination: dest,
        origin: origin,
        difference: dest.clone().sub(origin),
        offset: 0.0,
        outbound: true,
        impact_offset: 0.0,
        impact_acceleration: 0.0,
        has_impacted: false,
        target_new_health: action.new_health,
        // special conditions for cases where either attacker or target are not seen
        target_exists: true,
        attacker_exists: true
    };

}
function create_attack_piece(action){
    // create the attacker unit first of all
    //let attacker_unit = get_client_unit_by_id(action.unit_id);
    let attacker_unit = create_piece_at(action.unit, action.unit_id, action.pos, action.player_id);
    onscreen_units[attacker_unit.pos[0] + ',' + attacker_unit.pos[1]] = attacker_unit; // only so things dont explode when we delete this guy after
    let target_unit = get_client_unit_by_id(action.target_unit);

    if (attacker_unit == null || target_unit == null){
        console.log("[CLIENT] recieved instruction to attack piece that does not exist");
        return;
    }

    let dest = calculate_realworld_position_of(target_unit);
    let origin = calculate_realworld_position_of(attacker_unit);
    current_action = { type: attack_unit, unit: attacker_unit, target: target_unit,
        destination: dest,
        origin: origin,
        difference: dest.clone().sub(origin),
        offset: 0.0,
        outbound: true,
        impact_offset: 0.0,
        impact_acceleration: 0.0,
        has_impacted: false,
        target_new_health: action.new_health,
        // special conditions for cases where either attacker or target are not seen
        target_exists: true,
        attacker_exists: false
    };

}
// THIS ONE IS NOT DONE YET !!!!!!!!!!!!! // i think its done now // ok im pretty sure its actualkly done and working now 
function blind_attack_piece(action){
    let attacker_unit = get_client_unit_by_id(action.unit_id);
    if (attacker_unit == null){
        console.log("[CLIENT] recieved instruction to attack piece that does not exist");
        return;
    }

    // caclulate postion of not seen target unit
    let pos_off = get_location_offset(action.target_pos[0], action.target_pos[1]);
    let dest = new THREE.Vector3(pos_off[0], find_visual_hieght_at(action.target_pos[0]+","+action.target_pos[1], pos_off[0], pos_off[1]), pos_off[1]);

    let origin = calculate_realworld_position_of(attacker_unit);
    current_action = { type: attack_unit, unit: attacker_unit, target: null,
        destination: dest,
        origin: origin,
        difference: dest.clone().sub(origin),
        offset: 0.0,
        outbound: true,
        impact_offset: 0.0,
        impact_acceleration: 0.0,
        has_impacted: false,
        target_new_health: action.new_health,
        // special conditions for cases where either attacker or target are not seen
        target_exists: false,
        attacker_exists: true
    };

}
const attack_movement_speed = 0.028;
const attack_jump_height = 4.5;
const attack_jump_curve = 2.8;

const attack_impact_distance = 0.36;
const attack_impact_init_force = 0.6;
const attack_impact_decel_rate = 0.067;
function PROGRESS_attack_piece(){
    if (current_action.outbound){
        current_action.offset += attack_movement_speed*action_speed;
        if (current_action.offset >= 1.0){
            current_action.outbound = false; // aka we're heading back now
        }
    }else{ // heading back
        current_action.offset -= attack_movement_speed*action_speed;
        // check if we've now completed the movement, if so, end this action 
        if (current_action.offset <= 0.0 && (current_action.target_exists == false || current_action.impact_offset < 0.0)){
            // cleanup the highlight
            clear_unit_highlights(current_action.unit);
            current_action.unit.mesh.position.copy(current_action.origin);
            if (current_action.target != null){ 
                current_action.target.mesh.position.copy(current_action.destination);
            }

            if (current_action.attacker_exists == false){
                // then we have to clearnup the target, aka delete
                delete_unit(current_action.unit); 
            }
            current_action = null;
            return;
        }
    }
    let curr_distance = null;
    // do this check so we can continue the target's movements even if attacker finished
    if (current_action.offset > 0.0){
        let upwards_jump = 0;
        if (current_action.offset < 0.5){
            upwards_jump = (1 - Math.pow((1- (current_action.offset*2)), attack_jump_curve)) * attack_jump_height;
        }
        else if (current_action.offset > 0.5){ 
            upwards_jump = (1 - Math.pow((1- (1-((current_action.offset-0.5)*2))), attack_jump_curve)) * attack_jump_height;
        }
        else upwards_jump = jump_height; 
    
        let next_step_pos = current_action.destination.clone();
        curr_distance = current_action.difference.clone().multiplyScalar(1-current_action.offset);
        next_step_pos.sub(curr_distance);
        next_step_pos.y = next_step_pos.y + upwards_jump;
        current_action.unit.mesh.position.copy(next_step_pos);
    }
    if (current_action.target_exists != false) { // null should be true here
        if (!current_action.has_impacted && curr_distance != null && curr_distance.length() < attack_impact_distance){
            // now update the health of the unit
            current_action.target.defense = current_action.target_new_health;
            current_action.has_impacted = true
            current_action.impact_acceleration = attack_impact_init_force;
        }
        if (current_action.has_impacted && current_action.impact_offset >= 0.0 ){
            // now test how far away the target is push the piece 
            current_action.impact_offset += current_action.impact_acceleration;
            current_action.impact_acceleration -= attack_impact_decel_rate*action_speed;
    
            let curr_step = current_action.difference.clone().normalize().multiplyScalar(current_action.impact_offset).add(current_action.destination);
            current_action.target.mesh.position.copy(curr_step);
        }
    }
}
const unit_drop_height = 18.5;
const unit_drop_gravity = 0.038;
const unit_drop_bounce_factor = 0.38;
function create_piece(action){ // this will be used in a lot of places i think
    let creator_player = return_player_from_id(action.player_id);
    let created_unit = CLIENT_CREATE_UNIT(action.unit, action.unit_id, action.pos, creator_player);
    // add it to the scene and adjust position to match the set position
    scene.add(created_unit.mesh);
    let pos_off = get_location_offset(created_unit.pos[0], created_unit.pos[1]);
    let position = created_unit.pos[0]+","+created_unit.pos[1];
    // create tiles first so that the visual height matches up
    // then we make them visualize
    // THIS MAY CAUSE ISSUES
    onscreen_units[position] = created_unit;
    if (created_unit.owner == our_playerid){
        unit_see(created_unit);
        // update pricing stats
        apply_purchase(created_unit);
    }
    move_camera_to_coords(created_unit.pos);

    let action_tile_height = find_visual_hieght_at(position, pos_off[0], pos_off[1]);
    current_action = { type: create_unit, unit: created_unit, 
        destination: new THREE.Vector3(pos_off[0], action_tile_height, pos_off[1]),
        position: new THREE.Vector3(pos_off[0], action_tile_height + unit_drop_height, pos_off[1]),
        acceleraton: 0,
    };
    created_unit.mesh.position.copy(current_action.position);
}
function PROGRESS_create_piece(){
    current_action.acceleraton += unit_drop_gravity*action_speed;
    // bounce the object when it reaches the destination
    if (current_action.position.y <= current_action.destination.y){
        current_action.position.y = current_action.destination.y // do not go through
        current_action.acceleraton = current_action.acceleraton * -unit_drop_bounce_factor;
        // if the unit is under and is moving too slowly, then we can assume they've stopped bouncing
        if (Math.abs(current_action.acceleraton) < unit_drop_gravity*5 ){
            // cleanup the highlight
            // we dont have highlights on that unit, we created them with the thing queue
            //clear_unit_highlights(current_action.unit);
            let selected_coord_str = current_action.unit.pos[0]+","+current_action.unit.pos[1];
            let test_tile = queued_creation_highlights[selected_coord_str];
            if (test_tile != null){
                scene.remove(test_tile);
                delete queued_creation_highlights[selected_coord_str];
            }
            // finish bounce
            current_action.unit.mesh.position.copy(current_action.destination);
            check_if_causes_objective_update(current_action.unit, false);

            current_action = null;
            return;
        }
    }
    // update the object's position to the new one
    current_action.position.set(current_action.position.x, current_action.position.y - current_action.acceleraton, current_action.position.z);
    current_action.unit.mesh.position.copy(current_action.position);
}
// TO DO
const destroy_unit_size_deccel = 0.013;
const destroy_unit_init_accel = 0.11;
/* currently not using skulls 
const destroy_skull_init_size = 0.8;
const destroy_skull_expand_size = 2.8;
const destroy_skull_expand_step = 0.05;
const destroy_skull_shrink_step = 0.21;
*/
function action_destroy_piece(action){
    let target_unit = get_client_unit_by_id(action.unit_id);
    
    move_camera_to_coords(target_unit.pos);
    current_action = { type: destroy_unit, unit: target_unit, 
        acceleraton: destroy_unit_init_accel,
        curr_scale: 1.0,
    };
}
function PROGRESS_destroy_piece(){
    current_action.curr_scale += current_action.acceleraton*action_speed;
    current_action.acceleraton -= destroy_unit_size_deccel*action_speed;
    // ok make the visual changes
    current_action.unit.mesh.scale.set(current_action.curr_scale, current_action.curr_scale, current_action.curr_scale);
    // if less than 0 then cleanup
    if (current_action.curr_scale <= 0){
        delete_unit(current_action.unit);
        current_action = null;
        console.log("unit deleted");
    }
}

function delete_unit(target_unit){
    // clear their visibles, this woule only be fore if a unit was destroyed and was not able to make their move during action phase
    clear_unit_highlights(target_unit);
    unit_hide_objective(target_unit);
    
    check_if_causes_objective_update(target_unit, true);
    // clear the model from the scene
    scene.remove(target_unit.mesh);
    // clear the visible tiles owned by the unit
    if (target_unit.owner == our_playerid){
        unit_stop_seeing(target_unit)
    }
    // remove the piece from the unit list
    let target_unit_key = get_client_unit_KEY_by_id(target_unit.unit_id);
    if (onscreen_units[target_unit_key] == null){
        console.log("failure to delete unit based off of key")
    }
    delete onscreen_units[target_unit_key];
    
}
// currently do not need to return anything from this function, as it just instaniates the unit into the game
function create_piece_at_and_wrap(type, unit_id, coords, owner_id){
    let created_unit = create_piece_at(type, unit_id, coords, owner_id);
    onscreen_units[created_unit.pos[0] + ',' + created_unit.pos[1]] = created_unit;
    check_if_causes_objective_update(created_unit, false);
}
function create_piece_at(type, unit_id, coords, owner_id){
    let created_unit = CLIENT_CREATE_UNIT(type, unit_id, coords, return_player_from_id(owner_id));
    // add it to the scene and adjust position to match the set position
    scene.add(created_unit.mesh);
    let pos_ition = created_unit.pos[0]+","+created_unit.pos[1];
    let pos__off = get_location_offset(created_unit.pos[0], created_unit.pos[1]);
    let action__tile_height = find_visual_hieght_at(pos_ition, pos__off[0], pos__off[1]);
    
    created_unit.mesh.position.set(pos__off[0], action__tile_height, pos__off[1]);
    return created_unit;
}


//var actions_to_commit = [];
var stackions_to_commit = [];
var server_verified_moners = -9876; // hopefully we never see this value printed ingame
var is_in_action_mode = false;
var has_recieved_actions = false;
var last_state_was_action = false;
var action_active_bot = document.getElementById("cine_top_bar");
var action_active_top = document.getElementById("cine_bot_bar");

function enable_action_mode(){
    deselect_unit();
    //toggle_stat_display(false, null); // hmm i dont think we should have this here
    has_recieved_actions = false;
    is_in_action_mode = true;
    last_state_was_action = true;
    // reset the action process order
    action_phase = committing_attack_actions;
    // make the text visible
    //action_active_text.style.visibility = "visible";
    action_active_top.classList.toggle('fade');
    action_active_bot.classList.toggle('fade');
    document.body.style.cursor = "progress";
    // update timer colors
    last_time_was_action_time = true;
    timer_text.style.color = time_action_color
}
function disable_action_mode(){
    deselect_unit(); // just as a backup

    is_in_action_mode = false;
    // make the text invisible
    //action_active_text.style.visibility = "collapse";
    action_active_top.classList.toggle('fade');
    action_active_bot.classList.toggle('fade');
    // cleanup any denied actions
    let leftovers_counter = 0;
    for (let key in queued_creation_highlights){
        let test_tile = queued_creation_highlights[key];
        create_fail_indicator(test_tile.position);
        scene.remove(test_tile);
        delete queued_creation_highlights[key];
        leftovers_counter++;
    }
        
    for (let key in onscreen_units) {
        let curr_unit = onscreen_units[key];
        // hopefully this will convert them to ints and have them just work
        if (curr_unit.self_highlight != null || curr_unit.target_highlight != null){
            leftovers_counter++;
            create_fail_indicator(onscreen_units[key].mesh.position);
            clear_unit_highlights(onscreen_units[key]);
    }}
    if (leftovers_counter > 0){
        console.log("[CLIENT] there were " + leftovers_counter + " denied actions, cleared")
    }
    // since we cleared all moves, reset the expense counter to 0
    update_expenses_counter(0);
    // and then make sure we set our money to whatever the server told us
    update_money_counter(server_verified_moners);
    // then we try and select the unit that we're hovered over at the moment
    // make sure we serlect them after cleaning up the highlights

    update_cursor_type(); // so if we dont move cams, it'll still update
    // finally update the UI for the store
    update_unit_counts();
    // reset our calculated damage trackers
    for (let key in onscreen_units){
        onscreen_units[key].calculated_damage = 0;
    }

    // and then we run through our unit behaviours, so the units decide their next moves
    for (let key in onscreen_units){
        let current_unit = onscreen_units[key];
        if (current_unit.owner == our_playerid){ // then we own this unit, and can auto move it
            unit_mode_run(current_unit);
    }}
    // lastly select whatever unit we're looking at
    select_unit_at(selected_tile);
}
// //////////////////////// //
// SERVER CALLED FUNCTIONS //
// ////////////////////// //
const time_plenty_color = "#ffffff";
const time_warn_5s = "#ffe0e0";
const time_warn_4s = "#ffb0b0";
const time_warn_3s = "#ff9090";
const time_warn_2s = "#ff6060";
const time_warn_1s = "#ff3030";
const time_warn_0s = "#ff0000";
const time_action_color = "#3f3f3f";
var last_time_was_action_time = false;
function update_time(new_time, action_time){
    // occurs once a second // update the time left text & turn count
    let seconds_count = ""+(new_time%60);
    if (seconds_count.length < 2){
        seconds_count = "0" + seconds_count;
    }
    timer_text.innerText = Math.floor(new_time/60) + ":" + seconds_count;
    // update color based on time left
    // if action phase is active, then do not do that as we are already using the correct color
    if (new_time > 5){ // we can reset the color
        last_time_was_action_time = false;
        timer_text.style.color = time_plenty_color
    }else if (new_time == 5){
        timer_text.style.color = time_warn_5s
    }else if (new_time == 4){
        timer_text.style.color = time_warn_4s
    }else if (new_time == 3){
        timer_text.style.color = time_warn_3s
    }else if (new_time == 2){
        timer_text.style.color = time_warn_2s
    }else if (new_time == 1){
        timer_text.style.color = time_warn_1s
    }else if (!last_time_was_action_time && new_time == 0){
        timer_text.style.color = time_warn_0s
    }

    //action_text.innerText = "-".repeat(((new_time == 0)? action_time : 0 ));
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
var queued_creation_highlights = {};
// example ojbect:
/*
[coordstr]: just contains an object reference to the vis obj
*/
function clear_unit_highlights(unit_object){ 
    if (unit_object == null) return;
    if (unit_object.self_highlight != null){
        scene.remove(unit_object.self_highlight);
        unit_object.self_highlight = null;
    }
    if (unit_object.target_highlight != null){
        scene.remove(unit_object.target_highlight);
        unit_object.target_highlight = null;
    }
}

function count_highlight_cleanups(){
    let result = 1;
    for (c in highlight_cleanups) result++;
    return result;
}
function try_move_unit_to_pos(unit, to_coords){
    // first we need to check if this piece already has a move queued, then we should cancel their current move and assign a new one
    clear_units_prev_queued_move(unit);
    if (!test_whether_pos_is_occupied(to_coords)) {
        QUEUE_move_piece(unit, to_coords);
    }
}
function QUEUE_move_piece(unit, to_coords){
    // setup hightlights
    unit.target_highlight = action_hightlight_tile(to_coords[0], to_coords[1], move_unit);
    unit.self_highlight = action_hightlight_tile(unit.pos[0], unit.pos[1], create_unit, unit.type)

    action_queue.push({ type: move_unit, pos: to_coords, unit_id: unit.unit_id })
}
function QUEUE_attack_piece(unit, target_unit){
    // clear their previous move if they had one
    clear_units_prev_queued_move(unit);
    // setup hightlights
    unit.target_highlight = action_hightlight_tile(target_unit.pos[0], target_unit.pos[1], attack_unit);
    unit.self_highlight = action_hightlight_tile(unit.pos[0], unit.pos[1], create_unit, unit.type)

    action_queue.push({ type: attack_unit, target: target_unit.unit_id, unit_id: unit.unit_id })
}
function try_place_unit_at_selected(type){
    if (valid_placement_position(selected_tile)) {
        QUEUE_create_piece(type,selected_tile);
    }
}
function QUEUE_create_piece(type, coords){
    // here we put a highlight thing down, and we add it to a list of objects to flush when we submit all the actions
    let new_highlight = action_hightlight_tile(coords[0], coords[1], create_unit, type);
    let coord_str = coords[0] + ',' +coords[1];
    queued_creation_highlights[coord_str] = new_highlight;

    action_queue.push({ type: create_unit, pos: coords, unit: type })
    // then calculate the price
    apply_expense(type, false);
}
function clear_units_prev_queued_move(unit_obj){
    for (let j = 0; j < action_queue.length; j++){
        if (action_queue[j].type == move_unit || action_queue[j].type == attack_unit){
            if (action_queue[j].unit_id == unit_obj.unit_id){
                // cleanup their highlighted block
                clear_unit_highlights(unit_obj)
                action_queue.splice(j, 1);
                j--; // not needed but good practice anyway i think
                // we could definitely use a return here, becasue units should not beable to use more than one move
            }
        }
    }
}
function test_whether_pos_is_occupied(position_arr){
    let unit = onscreen_units[position_arr[0] + ',' + position_arr[1]];
    if (unit != null) { // we also need a way of allowing units to move to a position that another unit is queued to leave
        return true;
    }
    // loop through the action queue to make sure nothing is already happening at this tile
    for (let j = 0; j < action_queue.length; j++){
        if (action_queue[j].type == create_unit){
            if (action_queue[j].pos[0] == position_arr[0] && action_queue[j].pos[1] == position_arr[1]){
                return true;
        }}else if (action_queue[j].type == move_unit){
            if (action_queue[j].pos[0] == position_arr[0] && action_queue[j].pos[1] == position_arr[1]){
                return true;
    }}} return false; // no occlusions found
}
function valid_placement_position(position_arr){
    if (test_whether_pos_is_occupied(selected_tile)) return false;
    // first determine which placement mode we are in
    // if no workers left, resort placement mode
    if (has_workers_left){
        // for each worker unit
        for (let key in onscreen_units){
            let curr_unit = onscreen_units[key];
            if (curr_unit.type == unit_worker && curr_unit.owner == our_playerid){
                // then its a worker, iterate through list of output tiles
                for (let row = -curr_unit.attack_range; row <= curr_unit.attack_range; row++) {
                    let items_in_this_row = ((curr_unit.attack_range*2) + 1) - Math.abs(row);
                    let row_left_x = curr_unit.pos[0] - (curr_unit.attack_range - Math.floor(Math.abs(row)/2)) + ((Math.abs(curr_unit.pos[1]) % 2) * (Math.abs(row) % 2));
                    for (let column = 0; column < items_in_this_row; column++) {
                        let tile_x = row_left_x+column;
                        // check to make sure that this isn't just the worker's position tile
                        if (tile_x == curr_unit.pos[0] && row == 0){continue; }
                        if (tile_x == position_arr[0] && curr_unit.pos[1]+row == position_arr[1]){
                            return true;
                }}}
        }}
    }
    else{ // can place anywhere they can see, but for more money
        let pos_string = position_arr[0]+','+position_arr[1];
        if (instanced_tiles[pos_string] != null){
            // then we can place here
            return true;
    }}
    return false;
}


// ////////////// //
// CLIENT INPUTS //
// //////////// //
var last_hovered_tile = null;
var hovered_tile = [0,0]; 
var hovered_unit = null;
var selected_tile = [0,0]; // use this for whatever
var last_cam_vec = new THREE.Vector3(); // so we can test the last

var last_vec = new THREE.Vector3(); 
var mouse_pos_changed = true;
var mouse_pos_X = 0;
var mouse_pos_Y = 0;

var is_alt_down = false;
var is_shift_down = false;
var is_ctrl_down = false;
// new mouse move event, only update data and not double run the movement tick
function onPointerMove( event ) {
    mouse_pos_X = event.clientX;
    mouse_pos_Y = event.clientY;
    mouse_pos_changed = true;
}
function update_hovered_stuff(){
    // update the location of the UI if its up
    if (is_stat_ui_visible){
        // ok now reposition it
        resposition_stats_UI();
    }

    // ///////////////////////// //
    // HIGHLIGHT HOVER POSITION // 
    // /////////////////////// //
    if (mouse_pos_changed){
        last_vec.set(
            ( mouse_pos_X / window.innerWidth ) * 2 - 1,
            - ( mouse_pos_Y / window.innerHeight ) * 2 + 1,
            0.5 );

        last_vec.unproject( camera );
        last_vec.sub( camera.position ).normalize();
    } // else if the cursor didn't move, check to see if the camera did, if it didn't skip this update
    else if (compare_vectors(last_cam_vec, controls.object.position)) return; // no movement in mouse or camera position
    if (last_vec == undefined) return; // incase we called a tick update before there was a

    // store last states, so we can skip the calculations if there are no changes
    mouse_pos_changed = false;
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
        let prev_stat_is_ui_vis = is_stat_ui_visible; // this variable changes during the below line
        let is_unit_visible = update_cursor_type();
        if (!prev_stat_is_ui_vis && is_unit_visible){
            resposition_stats_UI();
        }
    }
    if (hovered_tile == null) return; // im pretty sure we dont need this
    // then we update the hovered unit, if the hovered unit is differetnt then we remove the old highjoight and then add a new one
    let new_hoveredd_unit = onscreen_units[hovered_tile[0] +','+ hovered_tile[1]]
    if (new_hoveredd_unit != hovered_unit){ // then we have a new hovered unit
        // deelect the old hoverewd unit if its not null
        if (hovered_unit != null && hovered_unit != currently_selected_unit){
            // but dont deselect them if they are the selected unit
            unit_hide_objective(hovered_unit);
        }
        // and then select the new one if the new one isn't null
        if (new_hoveredd_unit != null){
            unit_show_objective(new_hoveredd_unit);
        }
        hovered_unit = new_hoveredd_unit;
    }
}
// we actually need to return whether a unit was visible or not, so we can update the UI pos immediately
function update_cursor_type(){

    let offset_str = hovered_tile[0] + ',' + hovered_tile[1];
    // alright lets check to see what type of cursor should be active right now
    
    // if action mode, then we dont get cursor feedback on tiles // also alt mode means we dont pickup anything
    if (is_in_action_mode && !has_recieved_actions) {
        // we still need to check if someone was there
        let hovered_over_unit_for_ui = onscreen_units[offset_str];
        if (hovered_over_unit_for_ui != null){
            toggle_stat_display(true, hovered_over_unit_for_ui);
            return true; // there was someone there, so show stat UI
        }
        toggle_stat_display(false, null);
        return false; // no cursor types in action mode
    }
    if (is_alt_down){
        document.body.style.cursor = "auto";
        // also make sure the health thing shows up still though
        let hovered_over_unit = onscreen_units[offset_str];
        let is_unit_there = (hovered_over_unit != null);
        toggle_stat_display(is_unit_there, hovered_over_unit);
        return is_unit_there;
    }
    // only show unknown icons if not in special move mode
    if (!is_ctrl_down || currently_selected_unit == null){
        let known_tile_test = instanced_tiles[offset_str]
        if (known_tile_test == null){ // tile is not known
            document.body.style.cursor = "help";
            toggle_stat_display(false, null);
            return false;
        }
    }

    let move_tile = movement_visual_tiles[offset_str];
    let range_tile = range_visual_tiles[offset_str];

    let hovered_over_unit = onscreen_units[offset_str];

    if (hovered_over_unit != null){
        toggle_stat_display(true, hovered_over_unit);
        // if its an enemy
        if (hovered_over_unit.owner != our_playerid){
            if (currently_selected_unit != null){
                if (range_tile != null || move_tile != null){ // in attack range
                    document.body.style.cursor = "alias";
                    return true;
                } // otherwise we can set to follow this unit if ctrl mode
                if (is_ctrl_down){
                    document.body.style.cursor = "crosshair";
                    return true;
            }} // if not in control mode and not inrange, they are out of range
            // not in range
            document.body.style.cursor = "no-drop";
            return true;
        }
        if (currently_selected_unit != null && is_ctrl_down){
            document.body.style.cursor = "cell";
            return true;
        }
        // elses its friendly
        document.body.style.cursor = "pointer";
        return true;
    }
    toggle_stat_display(false, null);
    if (currently_selected_unit != null){
        if (move_tile != null){
            document.body.style.cursor = "move";
            return false;
        } // else if ctrl is held down, assume its a goto
        if (is_ctrl_down){
            document.body.style.cursor = "row-resize";
            return false;
    }}

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
    hover_stat_ui.style.left = ""+((mouse_pos_X / window.innerWidth ) * 100)+"%";
    hover_stat_ui.style.top  = "calc("+((mouse_pos_Y / window.innerHeight) * 100)+"% + 35px";
}

function game_speed_changed(){
   var slider_value = document.getElementById('game_speed_range').value / 10.0;
   slider_value += 1;
   document.getElementById('game_speed_text').innerHTML = slider_value;
   action_speed = slider_value;
}

// /////////////////////////////// //
// ORIENTATION LOCATION FUNCTIONS //
// ///////////////////////////// //
function move_camera_to_coords(new_coords){
    hovered_tile = new_coords;
    move_camera_to_hovered_coords();
}
function move_camera_to_hovered_coords(){ // aka 'goto'
    selected_tile = hovered_tile; // note down where the selected tile now is
    let _pos_off = get_location_offset(hovered_tile[0], hovered_tile[1]);
    let coords_Str = hovered_tile[0]+","+hovered_tile[1];
    let _height = find_visual_hieght_at(coords_Str, _pos_off[0], _pos_off[1])
    controls.goto_offset(_pos_off[0], _pos_off[1], _height+camera_height_above_tile);
    hightlight_selected_tile(_pos_off[0], _pos_off[1], _height); 
    // check whether or not we can place here
    if (valid_placement_position(selected_tile)){
        document.getElementById("s_pan_1").style["background-color"] = regular_price_tile_color;
        document.getElementById("s_pan_2").style["background-color"] = regular_price_tile_color;
        document.getElementById("s_pan_3").style["background-color"] = regular_price_tile_color;
        document.getElementById("s_pan_4").style["background-color"] = regular_price_tile_color;
    } else { // disable the store
        document.getElementById("s_pan_1").style["background-color"] = resort_price_tile_color;
        document.getElementById("s_pan_2").style["background-color"] = resort_price_tile_color;
        document.getElementById("s_pan_3").style["background-color"] = resort_price_tile_color;
        document.getElementById("s_pan_4").style["background-color"] = resort_price_tile_color;
    }
}
function interact_with_selected_tile(){
    // if theres a unit here, select them
    // this will inadvertedly make us automatically select units that we create
    // unless we create multiple in the same go, then it will select the last one, or probably the first one actually, after everything is done
    let coords_str = selected_tile[0]+","+selected_tile[1];
    

    let at_unit = onscreen_units[coords_str];
    if (currently_selected_unit == null){
        if (at_unit != null && at_unit.owner == our_playerid){
            select_unit(at_unit);
    }}else{ // if does already have a unit selected
        // first check if we're selecting the same guy
        if (currently_selected_unit == at_unit){
            select_unit(at_unit);
            return; // as of right now there are no behaviours for selecting the same unit
        }
        // then check if the at unit exists
        if (at_unit != null){
            // check if its a friendly unit
            if (at_unit.owner == our_playerid){
                // NOTE: we do not currently support multiselect, so we will only select the new unit here OR follow (if ctrl is held)
                // check if we are doing regular select
                if (!is_ctrl_down){
                    select_unit(at_unit);
                    return;
                } // else we are doing follow mode, hence follow unit
                unit_set_follow_mode(currently_selected_unit, at_unit);
                //deselect_unit(); // this will leave us with no unit selected but hovering over the followed unit
                select_unit(currently_selected_unit);
                return;
            } // else its an enemy unit
            // then check if they are inrange OR we ctrl clicked, meaning to follow them regardless
            if (!is_ctrl_down){
                if (movement_visual_tiles[coords_str] != null || range_visual_tiles[coords_str] != null){
                    QUEUE_attack_piece(currently_selected_unit, at_unit);
                    //deselect_unit();
                    select_unit(currently_selected_unit);
                    return;
                } // we only want to enter chase mode if the ctrl key is down, so skip if the criteria doesn't match
                deselect_unit();
                return;
            } // else we are going to enter chase mode
            unit_set_follow_mode(currently_selected_unit, at_unit);
            //deselect_unit();
            select_unit(currently_selected_unit);
            return;
        }
        
        // ok then check to see if this is a marked movement tile
        if (movement_visual_tiles[coords_str] != null){
            // then lets send a prompt to move here
            try_move_unit_to_pos(currently_selected_unit, selected_tile);
            //deselect_unit();
            select_unit(currently_selected_unit);
            return;
        } // else we're going to setup destination mode
        else if (is_ctrl_down){
            unit_set_destination_mode(currently_selected_unit, selected_tile);
            //deselect_unit();
            select_unit(currently_selected_unit);
            return;
        }
        // if none of that ran, then deselect unit
        deselect_unit();
}}
const camera_height_above_tile = 5;

// ////////////////////// //
// CLIENT CONTROL INPUTS //
// //////////////////// //
function client_mousedown(event) {
    event.preventDefault();
    if (event.button === 0){// left click
        move_camera_to_hovered_coords();
        if (!is_in_action_mode && !event.altKey) interact_with_selected_tile();
    }else{ // we aren't allowing the controls to use the left click, because that will be heavily used by the game
        controls.onMouseDown(event);
}}
function compare_vectors(a, b){
    if (a == undefined || b == undefined) return true;
    return a.x == b.x && a.y == b.y && a.z == b.z;
}

function client_keydown(event){
    if (is_in_action_mode) return; // skip actions if we're in action
    if        (event.key === '1'){ // place worker
        try_place_unit_at_selected(unit_worker);
    } else if (event.key === '2'){ // place soldier
        try_place_unit_at_selected(unit_soldier);
    } else if (event.key === '3'){ // place sniper
        try_place_unit_at_selected(unit_sniper);
    } else if (event.key === '4'){ // place tower
        try_place_unit_at_selected(unit_tower);
    } else if (event.key === '7'){ // set default mode
        if (is_ctrl_down){
            for (let ukey in onscreen_units){
                let curr_unert = onscreen_units[ukey];
                if (curr_unert.owner == our_playerid){
                    unit_set_default_mode(curr_unert);
        }}} else if (currently_selected_unit != null){
            unit_set_default_mode(currently_selected_unit);
            select_unit(currently_selected_unit);
        }
    } else if (event.key === '8'){ // set roam mode
        if (is_ctrl_down){
            for (let ukey in onscreen_units){
                let curr_unert = onscreen_units[ukey];
                if (curr_unert.owner == our_playerid){
                    unit_set_roam_mode(curr_unert);
        }}} else if (currently_selected_unit != null){
            unit_set_roam_mode(currently_selected_unit);
            select_unit(currently_selected_unit);
        }
    } else if (event.key === '9'){ // set aggressive mode
        if (is_ctrl_down){
            for (let ukey in onscreen_units){
                let curr_unert = onscreen_units[ukey];
                if (curr_unert.owner == our_playerid){
                    unit_set_aggressive_mode(curr_unert);
        }}} else if (currently_selected_unit != null){
            unit_set_aggressive_mode(currently_selected_unit);
            select_unit(currently_selected_unit);
        }
    } else if (event.key === '0'){ // toggle auto attack mode
        is_auto_attacking = !is_auto_attacking;
        if (!is_auto_attacking){
            document.getElementById("sr_auto_attack_img").src = disabled_source;
        } else{
            document.getElementById("sr_auto_attack_img").src = enabled_source;
            // we also want to apply the auto attack for each unit this turn
            for (let key in onscreen_units){
                let current_unit = onscreen_units[key];
                if (current_unit.owner == our_playerid){
                    let tiles_list = list_all_tiles_in_unit_range(current_unit.pos[0], current_unit.pos[1], current_unit.attack_range, current_unit.move_range, onscreen_units);
                    let in_range_target = unit_auto_attack(current_unit, tiles_list);
                    if (in_range_target != null){
                        clear_units_prev_queued_move(current_unit); 
                        QUEUE_attack_piece(current_unit, in_range_target);
    }}}}} else if (event.key === 'Backspace'){ // clear move on selected unit
        // find the currently selected unit first, thankfully we have that saaved already
        if (currently_selected_unit != null){
            clear_units_prev_queued_move(currently_selected_unit);
            unit_set_default_mode(currently_selected_unit);
        }else{ // is create umnit tile selected
            let selected_coord_str = selected_tile[0] + ',' + selected_tile[1];
            let test_tile = queued_creation_highlights[selected_coord_str];
            // see if theres a acreate unit tile here
            if (test_tile != null){
                // we can find the creation event by position?
                for (let j = 0; j < action_queue.length; j++){
                    let curr_action = action_queue[j];
                    // if the position matches, then thats our event
                    if (curr_action.type == create_unit && curr_action.pos[0] == selected_tile[0] && curr_action.pos[1] == selected_tile[1] ){
                        // visual refund for creation 
                        apply_expense(curr_action.unit, true);
                        // cleanup highlight
                        scene.remove(test_tile);
                        delete queued_creation_highlights[selected_coord_str];
                        // take the item out of the queue
                        action_queue.splice(j, 1);
                        j--;
    }}}}} else if (event.key === ' '){
        // either select or deselect unit on selected tile
        if (currently_selected_unit != null){
            deselect_unit();
        }else{
            select_unit_at(selected_tile);
    }}
    // put after incase anything notable happens with any other keys that are pressed
    // if any of the special keys changed, we need to update cursor style
    if (is_alt_down != event.altKey || is_ctrl_down != event.ctrlKey || is_shift_down != event.shiftKey){
        is_alt_down = event.altKey;
        is_ctrl_down = event.ctrlKey;
        is_shift_down = event.shiftKey;
        update_cursor_type();
    }
}
function client_keyup(event){
    if (is_alt_down != event.altKey || is_ctrl_down != event.ctrlKey || is_shift_down != event.shiftKey){
        is_alt_down = event.altKey;
        is_ctrl_down = event.ctrlKey;
        is_shift_down = event.shiftKey;
        update_cursor_type();
    }
}
function messagebox_keydown(event){
    if (event.key == 'Enter'){
        send_message_as_client();
    }
}

// //////////////////////////////// //
// CHAT FUNCTIONALITY INTERACTIONS //
// ////////////////////////////// //
function minimize_chat(){
    document.getElementById("chat_max").style.visibility = "collapse";
    document.getElementById("chat_min").style.visibility = "visible";
}
function expand_chat(){
    document.getElementById("chat_min").style.visibility = "collapse";
    document.getElementById("chat_max").style.visibility = "visible";
}
function min_chat_message(message, color){
    let min_caht = document.getElementById("chat_min");
    min_caht.innerHTML = message;
    min_caht.style.color = color;
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
        load_chat_mesage(data.content.text, return_player_from_id(data.content.user_id).color);
    }
    else if (data.type == SERVER_time_update){
        update_time(data.content.turn_time, data.content.action_time);
    }
    else if (data.type == SERVER_request_moves){
        server_connection.send({type: CLIENT_submit_moves, content: return_action_queue_and_cleanup()});
        enable_action_mode();
    }
    else if (data.type == SERVER_sendback_moves){
        // call that function  whatever it is
        // now pre process some of those actions
        // aka, load in all the discover actions
        // as well as remove them from the queue entirely, so we dont go crazy figuring out why we skip some actions occasionally
        //  we are also going to process the objective discovery events immediately? 
        // it would probably be a better idea to aniumate these a s it would hten notify the playewr thats thats wherer theya are supposed to play

        let new_stackion = data.content['moves'];
        server_verified_moners = data.content['money'];
        for (let j = 0; j < new_stackion.length; j++){
            let curr_Action = new_stackion[j];
            if (curr_Action.type == discover_unit){
                queued_discover_units[curr_Action.pos[0] + ',' + curr_Action.pos[1]] = curr_Action;
                console.log("unit discoverable at : " + curr_Action.pos[0] + ',' + curr_Action.pos[1]);
                new_stackion.splice(j, 1);
                j--; // make sure we account for the index that we just lost
        }} // make sure we do the objectives in their own loop,else they would not properly dsicover units probably (althoug we can assume it'd be fine actually, due to the server implementation)
        for (let j = 0; j < new_stackion.length; j++){
            let curr_Action = new_stackion[j];
            if (curr_Action.type == discover_objective){
                client_create_objetive(curr_Action.pos);
                new_stackion.splice(j, 1);
                j--; // how did we forget this :skull: :moyai:
        }} // then push to the main stackion
        stackions_to_commit.push(new_stackion);
        
        has_recieved_actions = true;
    }
    else{
        console.log("recieved invalid packet type: " + data.type); 
    }
}
function load_chat_mesage(m_text, color){
    UI_add_message(m_text, color);
    // and then append to client min chat
    min_chat_message(m_text, color);
}
function client_error(err){
    console.log("client connection experienced error:\n"+err);
    load_chat_mesage("peerjs server connection error, this may cause issues", "#ff0000");
    //abort_connection(err);
}
function server_error(err){
    console.log("connection to server experienced error:\n"+err);
    load_chat_mesage("game session server connection error, connection probably lost", "#ff0000");
    //abort_connection(err);
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
// update the text to be randomized
const hex_digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
server_pinfo_color.value = "#" + get_random_color_hex() + get_random_color_hex() + get_random_color_hex();
console.log(server_pinfo_color.value);
function get_random_color_hex(){
    return random_hex_char(6) + random_hex_char(0);
}
function random_hex_char(min){ // between 0-16 for min
    let hex_value = Math.floor(Math.random() * (16-min)) + min;
    return hex_digits[hex_value];
}

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
// what is going on here ??
async function attempt_to_paste_and_join(){
    let test = await navigator.clipboard.readText();
    if (test != null && test != ""){
        server_code_text.value = test;
        attempt_to_connect_to_server();
    }
}
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
    if (messagebox_text.value == null || messagebox_text.value == "") return;
    server_connection.send({type: CLIENT_user_message, content: messagebox_text.value});
    messagebox_text.value = "";  // clear text input
    // we dont do any other fancy stuff as the message will be sent back to us shortly
}