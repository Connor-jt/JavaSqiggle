
// //////////////// //
// TEXTURE CONFIGS //
// ////////////// //
function setup_player_colors(player){
    let color_mat = new THREE.MeshLambertMaterial({color: player.color, flatShading: true})
    player.worker_mat = [
        color_mat,
        worker_material 
    ];
    player.soldier_mat = [
        color_mat,
        solider_material
    ];
    player.sniper_mat = [
        color_mat,
        sniper_material 
    ];
    player.tower_mat = [
        color_mat,
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

const worker_material  = new THREE.MeshLambertMaterial({color: unit_soldier_color, flatShading: true})
const solider_material = new THREE.MeshLambertMaterial({color: unit_worker_color, flatShading: true})
const sniper_material  = new THREE.MeshLambertMaterial({color: unit_sniper_color, flatShading: true})
const tower_material   = new THREE.MeshLambertMaterial({color: unit_tower_color, flatShading: true})


function CLIENT_CREATE_UNIT(type, unit_id, position, player){
    let new_unit = init_new_unit_object(type, position, player.id);
    new_unit.unit_id = unit_id;
    if      (type == unit_worker)  new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.worker_mat);
    else if (type == unit_soldier) new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.soldier_mat);
    else if (type == unit_sniper)  new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.sniper_mat);
    else if (type == unit_tower)   new_unit.mesh = new THREE.Mesh(unit_mesh_geo, player.tower_mat);
    return new_unit;
}