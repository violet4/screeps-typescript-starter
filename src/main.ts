import { CreepGroups, Creeper, RoleType, groupCreepsByRole } from "creep/Creeper";
import { ErrorMapper } from "utils/ErrorMapper";
import {Spawner} from "./Spawner";

export type Success = "Success"
export const Success: Success = "Success"
export type Failure = "Failure"
export const Failure: Failure = "Failure"
export type ReachedDestination = "ReachedDestination"
export const ReachedDestination: ReachedDestination = "ReachedDestination"

const maxHarvesterCount = 3;
const maxUpgraderCount = 3;
const maxWorkerCount = 1;

export const loop = ErrorMapper.wrapLoop(() => {
    if (!Memory.creepCount)
        Memory.creepCount = 2;

    if (Game.cpu.bucket === 10000)
        Game.cpu.generatePixel();

    let creepGroups: CreepGroups = groupCreepsByRole(Object.values(Game.creeps));
    let needHarvesters = _.max([0, maxHarvesterCount - creepGroups[RoleType.Harvester].length]);
    let neededUpgraders = _.max([0, maxUpgraderCount - creepGroups[RoleType.Upgrader].length]);
    let needWorkers = _.max([0, maxWorkerCount - creepGroups[RoleType.Worker].length]);

    for (let creepName in Game.creeps) {
        let creep: Creep = Game.creeps[creepName];
        let creeper: Creeper = Creeper.initialize(creep);
        // console.log(`creeper ${JSON.stringify(creeper)} ${typeof creeper}`)
        creeper.runIsDone();
    }
    for (let structureName in Game.structures) {
        let structure = Game.structures[structureName];
        // structure.run();
    }
    for (let spawnName in Game.spawns) {
        let spawnStructure: StructureSpawn = Game.spawns[spawnName];
        let spawner = new Spawner(spawnStructure);
        if (!spawner.isActive() || spawner.spawning) {
            continue;
        }
        if (needHarvesters > 0 && spawner.spawnHarvester())
            needHarvesters -= 1;
        else if (neededUpgraders > 0 && spawner.spawnUpgrader())
            neededUpgraders -= 1;
        else if (needWorkers > 0 && spawner.spawnWorker())
            needWorkers -= 1;
    }

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
});
