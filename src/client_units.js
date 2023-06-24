
// //////////////// //
// TEXTURE CONFIGS //
// ////////////// //
function setup_player_colors(player){
    player.color_mat = new THREE.MeshLambertMaterial({color: player.color, flatShading: true})
    player.worker_mat = [
        player.color_mat,
        worker_material 
    ];
    player.soldier_mat = [
        player.color_mat,
        solider_material
    ];
    player.sniper_mat = [
        player.color_mat,
        sniper_material 
    ];
    player.tower_mat = [
        player.color_mat,
        tower_material 
    ];
}



// ///////////////// //
// CHARACTER MODELS //
// /////////////// //
//const worker_mesh      = new THREE.CylinderGeometry(1,1,1,3);
//const soldier_mesh     = new THREE.CylinderGeometry(1,1,1,3);
//const sniper_mesh      = new THREE.CylinderGeometry(1,1,1,3);
//const tower_mesh       = new THREE.CylinderGeometry(1,1,1,3);

const worker_material  = new THREE.MeshLambertMaterial({color: unit_worker_color, flatShading: true})
const solider_material = new THREE.MeshLambertMaterial({color: unit_soldier_color, flatShading: true})
const sniper_material  = new THREE.MeshLambertMaterial({color: unit_sniper_color, flatShading: true})
const tower_material   = new THREE.MeshLambertMaterial({color: unit_tower_color, flatShading: true})

const umode_none        = 0;
const umode_roam        = 1;
const umode_aggressive  = 2;
const umode_follow      = 3; // also determined by the target value
const umode_destination = 4; // also determined by dest value

function CLIENT_CREATE_UNIT(type, unit_id, position, player){
    let new_unit = init_new_unit_object(type, position, player.id);
    new_unit.unit_id = unit_id;
    new_unit.self_highlight = null; // used to visualize that this target has had a move allocated
    new_unit.target_highlight = null; // used to visualize what this unit'sa target is
    new_unit.dest_highlight = null; // highlight ref
    new_unit.dest = null; // pos array
    new_unit.target_id = null; // used for following both enemies and friendlies
    new_unit.mode = umode_none;
    new_unit.calculated_damage = 0;
    if      (type == unit_worker)  new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.worker_mat);
    else if (type == unit_soldier) new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.soldier_mat);
    else if (type == unit_sniper)  new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.sniper_mat);
    else if (type == unit_tower)   new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.tower_mat);
    return new_unit;
}