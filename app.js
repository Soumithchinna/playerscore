const express = require('express')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
let db = null

const inititaliseDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Db Error:${e.message}`)
    process.exit(1)
  }
}
inititaliseDbandServer()
const convertDbobjectToPascalcase = dbOject => {
  return {
    stateId: dbOject.state_id,
    stateName: dbOject.state_name,
    population: dbOject.population,
  }
}
app.get('/states/', async (request, response) => {
  const getAllStatesQuery = `
    SELECT
    *
    FROM
    state
    ORDER BY
    state_id;`
  const statesList = await db.all(getAllStatesQuery)
  response.send(
    statesList.map(eachItem => convertDbobjectToPascalcase(eachItem)),
  )
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id=${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertDbobjectToPascalcase(state))
})
const convertDistrictObjectTOPascalcase = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const addDistrictName = `
    INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(addDistrictName)
  response.send('District Successfully Added')
})
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id=${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(convertDistrictObjectTOPascalcase(district))
})
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
    DELETE FROM
    district
    WHERE
    district_id=${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrict = `
    UPDATE
    district
    SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE
    district_id=${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})
app.get('/states/:statesId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStateQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths) 
    FROM 
    district
    WHERE
    state_id=${stateId};`;
  const stats = await db.get(getStateStateQuery)
  console.log(stats)
  response.send({
    totalCases:stats["SUM(cases)"],
    totalCured:stats["SUM(cured)"],
    totalActive:stats["sum(active)"],
    totalDeaths:stats["Sum(deaths)"]
  })
})
app.get("/districts/:districtId/details/",async (request, response) => {
const { districtId } = request.params;
const stateDetails=`
SELECT state_name
FROM state JOIN ON district state.state_id=district.district.state_id
WHERE district.district_id=${districtId};`;
const stateName=await db.get(stateDetails);
response.send({stateName:stateName.state_name})
});
module.exports = app
