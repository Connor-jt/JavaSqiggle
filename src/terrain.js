// DO ON INIT, AS WE NEED TO RECIEVE THE SEED FOR THIS
var lesser_noise2D = null;
var greater_noise2D = null;

// /////////// //
// TILE SETUP //
// ///////// //
const tile_height = 0.4;
const geometry      = new THREE.CylinderGeometry(1,1,tile_height,6);
/* grasslands kinda color
const MAT_tile_top  = new THREE.MeshPhongMaterial({color: 0xd7e1ca, flatShading: true });
const MAT_tile_high = new THREE.MeshPhongMaterial({color: 0x497910, flatShading: true });
const MAT_tile_mid  = new THREE.MeshPhongMaterial({color: 0x7aa700, flatShading: true });
const MAT_tile_low  = new THREE.MeshPhongMaterial({color: 0xbfd134, flatShading: true });
const MAT_tile_bot  = new THREE.MeshPhongMaterial({color: 0x003ca6, flatShading: true });
*/
// mesa lands color 
const MAT_tile_top  = new THREE.MeshPhongMaterial({color: 0x812B30, flatShading: true });
const MAT_tile_high = new THREE.MeshPhongMaterial({color: 0xAA2600, flatShading: true });
const MAT_tile_mid  = new THREE.MeshPhongMaterial({color: 0xE76300, flatShading: true });
const MAT_tile_low  = new THREE.MeshPhongMaterial({color: 0xD43A00, flatShading: true });
const MAT_tile_bot  = new THREE.MeshPhongMaterial({color: 0xA04030, flatShading: true });

// ////////////////// //
// TILE HIGHLIGHTING //
// //////////////// //
var highlight;
var selected_highlight;
const highlight_hieght = 0.5;
const highlight_middle_hieght = (highlight_hieght*tile_height)/2;
const highlight_pointer_hieght = 0.7;
const highlight_pointer_middle_hieght = (highlight_hieght*highlight_pointer_hieght)/2;

const MAT_highlight = new THREE.MeshBasicMaterial({color: 0xffffffff });
const MAT_selected_highlight = new THREE.MeshBasicMaterial({color: 0xffcfcfff });

const MAT_action_create_soldier_highlight = new THREE.MeshBasicMaterial({color: unit_soldier_color });
const MAT_action_create_worker_highlight = new THREE.MeshBasicMaterial({color: unit_worker_color });
const MAT_action_create_sniper_highlight = new THREE.MeshBasicMaterial({color: unit_sniper_color });
const MAT_action_create_tower_highlight = new THREE.MeshBasicMaterial({color: unit_tower_color });



const MAT_action_move_highlight = new THREE.MeshBasicMaterial({color: 0xff7f7fff });
const MAT_action_attack_highlight = new THREE.MeshBasicMaterial({color: 0xffef4f4f });

const MAT_preview_move_highlight = new THREE.MeshBasicMaterial({color: 0xff5fff5f });
const MAT_preview_range_highlight = new THREE.MeshBasicMaterial({color: 0xff5f5fff });
const MAT_preview_attack_highlight = new THREE.MeshBasicMaterial({color: 0xffff4f4f });
const MAT_preview_objective_highlight = new THREE.MeshBasicMaterial({color: 0xff4fffff });

const pointer_tile_size_multiplier = 0.8;
const pointer_tile_height = 0.85;
const action_tile_size_multiplier = 1.1;
const objective_multiplier = 1.05;
function action_hightlight_tile(x, y, type, unit_type){ // unit_type is only used when we 
    // create highlight item if not created already
    let action_highlight_tile;
    if (type == create_unit){
        // configure tile color to match unit, so everything looks cleaner
        if      (unit_type == unit_soldier) action_highlight_tile = new THREE.Mesh(geometry, MAT_action_create_soldier_highlight);
        else if (unit_type == unit_worker ) action_highlight_tile = new THREE.Mesh(geometry, MAT_action_create_worker_highlight );
        else if (unit_type == unit_sniper ) action_highlight_tile = new THREE.Mesh(geometry, MAT_action_create_sniper_highlight );
        else if (unit_type == unit_tower  ) action_highlight_tile = new THREE.Mesh(geometry, MAT_action_create_tower_highlight  );
    }else if (type == move_unit){
        action_highlight_tile = new THREE.Mesh(geometry, MAT_action_move_highlight);
    }else{ // attack unit
        action_highlight_tile = new THREE.Mesh(geometry, MAT_action_attack_highlight);
    }
    action_highlight_tile.scale.set(1*action_tile_size_multiplier, highlight_hieght*action_tile_size_multiplier, 1*action_tile_size_multiplier); // set height
    scene.add(action_highlight_tile);
    let pos_off = get_location_offset(x, y);
    action_highlight_tile.position.set(pos_off[0], find_visual_hieght_at(x+","+y, pos_off[0], pos_off[1])+highlight_middle_hieght, pos_off[1]);
    return action_highlight_tile;
}
const preview_move = 0;
const preview_range = 1;
const preview_enemy = 2;
const preview_friendly = 3;
const preview_objective = 4;

function preview_hightlight_tile(x, y, type){
    // create highlight item if not created already
    let output_tile;
    let scale_hieght = highlight_hieght;
    if (type == preview_enemy){
        output_tile = new THREE.Mesh(geometry, MAT_preview_attack_highlight);
    }else if (type == preview_move){
        output_tile = new THREE.Mesh(geometry, MAT_preview_move_highlight);
    }else if (type == preview_range){
        output_tile = new THREE.Mesh(geometry, MAT_preview_range_highlight);
    }else if (type == preview_objective){
        output_tile = new THREE.Mesh(geometry, MAT_preview_objective_highlight);
        scale_hieght *= objective_multiplier;
    }
    output_tile.scale.set(1, scale_hieght, 1); // set height
    scene.add(output_tile);
    let pos_off = get_location_offset(x, y);
    output_tile.position.set(pos_off[0], find_visual_hieght_at(x+","+y, pos_off[0], pos_off[1])+highlight_middle_hieght, pos_off[1]);
    return output_tile;
}
// needs the integer offset (tile indexes)
function hightlight_selected_tile(x, y, z){ // copy the position from the selected tile
    if (selected_highlight == null){
        selected_highlight = new THREE.Mesh(geometry, MAT_selected_highlight);
        selected_highlight.scale.set(1, highlight_pointer_hieght, 1); // set height
        scene.add(selected_highlight);
    }
    selected_highlight.position.set(x, z+highlight_pointer_middle_hieght, y);
}
function hightlight_tile(x, y){
    // create highlight item if not created already
    if (highlight == null){
        highlight = new THREE.Mesh(geometry, MAT_highlight);
        highlight.scale.set(1*pointer_tile_size_multiplier, pointer_tile_height, 1*pointer_tile_size_multiplier); // set height
        scene.add(highlight);
    }
    let pos_off = get_location_offset(x, y);
    highlight.position.set(pos_off[0], find_visual_hieght_at(x+","+y, pos_off[0], pos_off[1])+highlight_pointer_middle_hieght, pos_off[1]);
}
function find_visual_hieght_at(x_y_coord, real_x, real_y){
    // test to see if this tile is known
    let tile = instanced_tiles[x_y_coord];
    let height = 0;
    if (tile != null) {
        height = location_height(real_x, real_y);
    }
    return (height *tile_height);
}

var instanced_tiles = {}; // create an empty array for the tiles
var movement_visual_tiles = {}; // this is for moving units, it will preview the moves that you can make
var range_visual_tiles = {}; // this is for attacking units at range, ideally only ranged units will use this 
function create_tile(x, y, discover_list){
    // check that the tile doesn't already exist, if it does skip creation
    let position_string =  x + "," + y;
    let tile = instanced_tiles[position_string];
    if (tile != null){
        tile['use_count'] += 1;
        //console.log("tile \"" + position_string + "\" already exists, new use count = " + tile['use_count']);
        return;
    }
    // figure out if its an off tile or not
    let pos_off = get_location_offset(x, y); // position offset
    // generate tile height
    let tile_z = location_height(pos_off[0], pos_off[1]);
    // determine hieght color
    let hieght_color;
    if (tile_z == 1)                             hieght_color = MAT_tile_bot;  // bot  :: 0
    else if (tile_z <= maximum_tile_height*0.33) hieght_color = MAT_tile_low;  // low  :: < 33% max_height
    else if (tile_z <= maximum_tile_height*0.66) hieght_color = MAT_tile_mid;  // mid  :: < 66% max_height
    else if (tile_z < maximum_tile_height)       hieght_color = MAT_tile_high; // high :: < max_height
    else                                         hieght_color = MAT_tile_top;  // top  :: max_height 
    // create instance with height relative material
    let tile_instance = new THREE.Mesh(geometry, hieght_color);
    tile_instance.scale.set(1, tile_z, 1); // set height
    // x-z-y format???? why????
    tile_instance.position.set(pos_off[0], (tile_z/2)*tile_height, pos_off[1]);
    // add new tile and record it to the tile instances
    scene.add(tile_instance);
    instanced_tiles[position_string] = { tile : tile_instance, use_count : 1 };
    
    if (discover_list[position_string] != null) return position_string;
}
function remove_tile(x, y, delete_list){
    let position_string =  x +"," + y;
    let tile = instanced_tiles[position_string];
    if (tile != null){
        tile['use_count'] -= 1;
        if (tile['use_count'] <= 0){
            scene.remove(tile['tile']);
            delete instanced_tiles[position_string];
            // test whether theres a unit here 
            if (delete_list[position_string] != null) return position_string;
    }}
    else console.log("tile \"" + position_string + "\" does not exist, thus cannot be destroyed");
}
function create_tile_circle(x, y, radius, discover_list){
    let create_list = [];
    // go through each row of elements
    // elements in row = ((radius*2) + 1) - abs(j)
    for (let row = -radius; row <= radius; row++) {
        let items_in_this_row = ((radius*2) + 1) - Math.abs(row);
        let row_left_x = x - (radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));
        for (let column = 0; column < items_in_this_row; column++) {
            // figure out if its an off row, if so than add 1
            let result = create_tile(row_left_x + column, y + row, discover_list);
            if (result != null) 
            create_list.push(result);
    }}
    return create_list;
}
function delete_tile_circle(x, y, radius, delete_list){
    let del_list = [];
    // go through each row of elements
    // elements in row = ((radius*2) + 1) - abs(j)
    for (let row = -radius; row <= radius; row++) {
        let items_in_this_row = ((radius*2) + 1) - Math.abs(row);
        let row_left_x = x - (radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));
        for (let column = 0; column < items_in_this_row; column++) {
            // figure out if its an off row, if so than add 1
            let result = remove_tile(row_left_x + column, y + row, delete_list);
            if (result != null) 
            del_list.push(result);
    }}
    return del_list;
}
function preview_moves_at(x, y, outer_radius, inner_radius, visible_units){
    preview_clear_moves();
    // do the circle select thing at
    // 
    // 
    let tiles_list = list_all_tiles_in_unit_range(x, y, outer_radius, inner_radius, visible_units);
    // process unit tiles
    for (let j in tiles_list.unit){
        let vis_tile = tiles_list.unit[j];
        range_visual_tiles[j] = preview_hightlight_tile(vis_tile[0], vis_tile[1], preview_enemy);
    }
    // process range tiles
    for (let j in tiles_list.range){
        let vis_tile = tiles_list.range[j];
        range_visual_tiles[j] = preview_hightlight_tile(vis_tile[0], vis_tile[1], preview_range);
    }
    // process movement tiles
    for (let j in tiles_list.move){
        let vis_tile = tiles_list.move[j];
        movement_visual_tiles[j] = preview_hightlight_tile(vis_tile[0], vis_tile[1], preview_move);
    }
}
function list_all_tiles_in_unit_range(x, y, outer_radius, inner_radius, visible_units){
    let move_tile_list = {};
    let range_tile_list = {};
    let unit_list = {};

    for (let row = -outer_radius; row <= outer_radius; row++) {
        // test whether the row is out of range
        let is_inner_radius = (Math.abs(row) <= inner_radius);

        let items_in_this_row = ((outer_radius*2) + 1) - Math.abs(row);
        let row_left_x = x - (outer_radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));

        let inner_items_in_this_row = 0;
        let inner_row_left_x = 0;
        if (is_inner_radius){
            inner_items_in_this_row = ((inner_radius*2) + 1) - Math.abs(row);
            inner_row_left_x = x - (inner_radius - Math.floor(Math.abs(row)/2)) + ((Math.abs(y) % 2) * (Math.abs(row) % 2));
        }
        for (let column = 0; column < items_in_this_row; column++) {
            // test whether a unit occupies the target tile, and get the string to write the thingo at
            let current_x = row_left_x + column;
            let current_y = y + row;
            if (current_x == x && current_y == y) continue; // we do not want the tile that our piece is on
            
            let position_string = current_x + "," + current_y;
            let is_this_position_inner = is_inner_radius;
            if (is_inner_radius) {
                is_this_position_inner = ((current_x >= inner_row_left_x) && (current_x < inner_row_left_x+inner_items_in_this_row)) ;
            }
            if (visible_units[position_string] != null){
                unit_list[position_string] = [current_x, current_y];
            } else if (is_this_position_inner) {
                move_tile_list[position_string] = [current_x, current_y];
            } else {            
                range_tile_list[position_string] = [current_x, current_y];
            }
        }
    }

    return {
        move: move_tile_list,
        range: range_tile_list,
        unit: unit_list
    }
}
function preview_clear_moves(){
    for (let key in movement_visual_tiles) {
        // access each key, remove from scene and then delete it
        scene.remove(movement_visual_tiles[key]);
        delete movement_visual_tiles[key];
    }
    for (let key in range_visual_tiles) {
        // access each key, remove from scene and then delete it
        scene.remove(range_visual_tiles[key]);
        delete range_visual_tiles[key];
    }
}



// ///////////////////////// //
// LOCATION/NOISE FUNCTIONS //
// /////////////////////// //
function approximate_tile_index(x, y){
    // X & Y MUST be integers
    y = Math.round(y / 1.5);
    x = Math.round((x - ((Math.abs(y) % 2) * 0.866025)) / 1.73205);
    return [x, y];
}
function get_location_offset(x, y){
    // X & Y MUST be integers
    x = (x * 1.73205) + ((Math.abs(y) % 2) * 0.866025);
    y = (y * 1.5);
    return [x, y];
}
// must be integers or you'll break everything
const maximum_tile_height = 15;
const noise_sea_level = 5; 

const noise_detail_scale = 0.04;
const noise_detail_amplitude = 1.0; // doesn't really work that well
const noise_large_scale = 0.01;
const noise_large_falloff = 2.3223; // MUST be above 0.0f, 1.0 is linear, above is steepness, below is shallowness
const noise_clumpiness = 0.83; // between (or) 0.0 - 1.0

var highest_recorded_height = 0; // used to figure out the actual maximum tile height lol
function location_height(x,y){
    let detail_noise = (lesser_noise2D(x*noise_detail_scale, y*noise_detail_scale) + 1) / 2;
    let large_noise = greater_noise2D(x*noise_large_scale, y*noise_large_scale);
    // use large_noise as a mask to the detail noise?
    let noise_mask = large_noise;
    if (large_noise < 1 && large_noise > -1){
        noise_mask = Math.sign(large_noise) * (1 - Math.pow(1 - Math.abs(large_noise), noise_large_falloff));
    }
    noise_mask = (noise_mask+1) / 2;
    let result = Math.max(Math.floor((((detail_noise * noise_detail_amplitude * noise_mask) + (noise_mask*noise_clumpiness)))  * maximum_tile_height ) + 1 - noise_sea_level, 1);
    if (result > highest_recorded_height) highest_recorded_height = result; // record as new highest if this is higher
    return result;
}