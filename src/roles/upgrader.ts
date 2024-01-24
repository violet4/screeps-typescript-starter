
/*

In order for you to build extra spawns, roads, and extensions, you have to upgrade the Room Controller Level (RCL) by pumping energy into the controller using Creep.upgradeController method\

Available structures per RCL
    https://docs.screeps.com/control.html#Available-structures-per-RCL
    RCL Energy to upgrade  Structures
    0   —                  Roads, 5 Containers
    1   200                Roads, 5 Containers, 1 Spawn
    2   45,000             Roads, 5 Containers, 1 Spawn, 5 Extensions (50 capacity),
                           Ramparts (300K max hits), Walls


a Controller not affected by an upgradeController action will run a downgrade timer losing 20,000 game ticks at RCL 1, or 5,000 game ticks at RCL 2 to 150,000 game ticks at RCL 8. All timers are listed in the StructureController prototype.

// You can attack another player's controller downgrade timer by applying attackController on it.

*/

export default function upgraderRun(creep: Creep) {
    creep.memory.role = "roletype";
    creep.memory.room;
    creep.memory.working;
    creep.memory.stuff;
    // creep.memory.stuff = "1345";
    // creep.upgradeController
};
