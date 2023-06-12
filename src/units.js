var current_unit_index = 0;
function generate_new_unit_id(){
    current_unit_index++;
    return current_unit_index;
}
/*
var unit = {
    defense: 1,      // used to determine how much damage this unit can sustain before expiring
    attack: 1,       // used to determine how much damage to apply when attacking

    move_range: 1,   // used to determine how many tiles in a direction a unit can move
    attack_range: 1, // used to determine how many tiles this unit can attack in

    model: 0,        // used to instaniate the visual aspect of this unit
    unit_id: -1      // used to have a common referencable id between clients
}
*/

// ///////////////////////// //
// CHARACTER MODEL INDICIES //
// /////////////////////// //
const unit_worker  = 0;
const unit_soldier = 1;
const unit_sniper  = 2;
const unit_tower   = 3;

const worker_cost = 75;
const soldier_cost = 125;
const sniper_cost = 225;
const tower_cost = 500;
// for now just add 125 to the cost
const worker_resort_cost = 200;
const soldier_resort_cost = 250;
const sniper_resort_cost = 350;
const tower_resort_cost = 625;

function SERVER_CREATE_UNIT(type, position, player_id){
    let new_unit = init_new_unit_object(type, position, player_id);
    new_unit.unit_id = generate_new_unit_id();
    return new_unit;
}

// /////////////////////////// //
// CHARACTER STATS GENERATION //
// ///////////////////////// //
function init_new_unit_object(type, position, owning_player_id){
    let n_unit = stats_for_unit(type);
    n_unit.pos = position;
    n_unit.type = type;
    n_unit.owner = owning_player_id;
    return n_unit;
}
function stats_for_unit(type){
    if      (type == unit_worker)  return create_worker();
    else if (type == unit_soldier) return create_soldier();
    else if (type == unit_sniper)  return create_sniper();
    else if (type == unit_tower)   return create_tower();
    
    return -1;
}
function create_soldier(){
    return {
        defense: 3,     
        attack: 2,      
        
        move_range: 2,  
        attack_range: 2,
        vision_range: 2
    };
}
function create_worker(){
    return {
        defense: 2,     
        attack: 2,      
        
        move_range: 1,  
        attack_range: 1,
        vision_range: 3
    };
}
function create_sniper(){
    return {
        defense: 2,     
        attack: 1,      
        
        move_range: 1,  
        attack_range: 4,
        vision_range: 5
    };
}
function create_tower(){
    return {
        defense: 10,     
        attack: 5,      
        
        move_range: 1,  
        attack_range: 2,
        vision_range: 3
    };
}