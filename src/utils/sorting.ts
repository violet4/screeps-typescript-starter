let i = 0;
const buildOrderPriorities: {[key in BuildableStructureConstant]: number} = {
    "extension": i++,
    "rampart": i++,
    "road": i++,
    "spawn": i++,
    "link": i++,
    "constructedWall": i++,
    "storage": i++,
    "tower": i++,
    "observer": i++,
    "powerSpawn": i++,
    "extractor": i++,
    "lab": i++,
    "terminal": i++,
    "container": i++,
    "nuker": i++,
    "factory": i++,
}

type HasStructureType = {structureType: BuildableStructureConstant};

function prioritizeBuildableStructures(targets: HasStructureType[]) {
    targets.sort(function compareStructures(a: HasStructureType, b: HasStructureType) {
        return buildOrderPriorities[a.structureType] - buildOrderPriorities[b.structureType];
    });
}
