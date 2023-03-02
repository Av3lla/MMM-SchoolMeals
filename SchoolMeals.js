/* Magic Mirror
* Module: SchoolMeals
*
* By Avella https://github.com/Av3lla
* MIT Licensed.
*/
Module.register("SchoolMeals", {
  defaults: {
    key: null,
    schoolName: null,
    updateInterval: 1000 * 60 * 60
  },
  
  start: function() {
    // define global variables
    this.fullSchoolName;
    this.isThereLunch;
    this.isThereDinner;
    /*
    this.mealType = "급식";
    */
    this.lunchMenu = '';
    this.dinnerMenu = '';
    /* 
    this.kcal;
    this.nutritions;
    this.origins;
    */
    var self = this;
    Log.info("Starting module: " + this.name);
    // load data
    this.load();
    // schedule refresh
    setInterval(function() {
      self.updateDom();
    }, this.config.updateInterval)
  },
  
  load: function() {
    this.getSchoolInfo();
  },
  
  getStyles: function() {
    return ["SchoolMeals.css"];
  },
  
  getHeader: function() {
    return `${this.fullSchoolName} ${'급식'}`;
  },
  
  getSchoolInfo: async function() {
    // request
    const url = "https://open.neis.go.kr/hub/schoolInfo";
    const requestUrl = `${url}?Key=${this.config.key}&Type=${'json'}&pIndex=${1}&pSize=${100}&SCHUL_NM=${this.config.schoolName}`;
    // fetch
    const schoolInfo = await fetch(requestUrl)
      .then(rawResponse => {
        return rawResponse.json();
      })
      .catch(error => {
        console.log(error);
      });
    // get school code from schoolInfo
    const result = schoolInfo.schoolInfo[1].row[0];
    const eduCode = result.ATPT_OFCDC_SC_CODE;
    const schoolCode = result.SD_SCHUL_CODE;
    this.fullSchoolName = result.SCHUL_NM;
    //get lunch menu
    this.getMenu(eduCode, schoolCode);
  },
  
  getMenu: async function(eduCode, schoolCode) {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/-/g, '').slice(0, 8);
    // request
    const url = "https://open.neis.go.kr/hub/mealServiceDietInfo";
    const requestUrl = `${url}?Key=${this.config.key}&Type=${'json'}&pIndex=${1}&pSize=${100}&ATPT_OFCDC_SC_CODE=${eduCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${formattedDate}`;
    // fetch
    const mealsInfo = await fetch(requestUrl)
      .then(rawResponse => {
        return rawResponse.json();
      })
      .catch(error => {
        console.log(error);
      });
    // get lunch menu
    try {
      //this.mealType = mealsInfo.mealServiceDietInfo[1].row[0].MMEAL_SC_NM
      const rawLunchMenu = mealsInfo.mealServiceDietInfo[1].row[0].DDISH_NM;
      for (i of rawLunchMenu.split('<br/>')) {
        this.lunchMenu += i.replace(/[^ㄱ-ㅎ가-힣]/g, '') + "<br/>";
      }
      this.kcal = mealsInfo.mealServiceDietInfo[1].row[0].CAL_INFO;
      this.origins = mealsInfo.mealServiceDietInfo[1].row[0].ORPLC_INFO;
      this.nutritions = mealsInfo.mealServiceDietInfo[1].row[0].NTR_INFO;
      this.isThereLunch = true;
    } catch (error) {
      console.log(error);
      if (error.name === 'TypeError') {
        this.isThereLunch = false;
      }
    }
    //get dinner menu
    try {
      //this.mealType = mealsInfo.mealServiceDietInfo[1].row[0].MMEAL_SC_NM
      const rawDinnerMenu = mealsInfo.mealServiceDietInfo[1].row[1].DDISH_NM;
      for (i of rawDinnerMenu.split('<br/>')) {
        this.dinnerMenu += i.replace(/[^ㄱ-ㅎ가-힣]/g, '') + "<br/>";
      }
      this.kcal = mealsInfo.mealServiceDietInfo[1].row[1].CAL_INFO;
      this.origins = mealsInfo.mealServiceDietInfo[1].row[1].ORPLC_INFO;
      this.nutritions = mealsInfo.mealServiceDietInfo[1].row[1].NTR_INFO;
      this.isThereDinner = true;
    } catch (error) {
      console.log(error);
      if (error.name === 'TypeError') {
        this.isThereDinner = false;
      }
    }
    this.updateDom();
  },
  
  getDom: function() {
    var mainDiv = document.createElement("div");
    mainDiv.className = "main";
    var menuDiv = document.createElement("div");
    menuDiv.className = "menu";
    var mealIndexDiv = document.createElement("div");
    mealIndexDiv.className = "mealindex";
    var lunchIndexDiv = document.createElement("div");
    var dinnerIndexDiv = document.createElement("div");
    var lunchDiv = document.createElement("div");
    lunchDiv.className = "lunch";
    var dinnerDiv = document.createElement("div");
    dinnerDiv.className = "dinner";
    /*
    var exceptionDiv = document.createElement("div");
    var menuInfoDiv = document.createElement("div");
    menuInfoDiv.className = "menuInfo";
    var kcalDiv = document.createElement("div");
    kcalDiv.className = "kcal";
    var originDiv = document.createElement("div");
    originDiv.className = "origin";
    var nutriDiv = document.createElement("div");
    nutriDiv.className = "nutri";
    */

    lunchIndexDiv.innerHTML = "중식";
    dinnerIndexDiv.innerHTML = "석식";
    if (!this.isThereLunch) {
      lunchDiv.innerHTML = "오늘은 점심이 없습니다. :<";
    } else {
      lunchDiv.innerHTML = this.lunchMenu;
    }
    if (!this.isThereDinner) {
      dinnerDiv.innerHTML = "오늘은 저녁이 없습니다. :<";
    } else {
      dinnerDiv.innerHTML = this.dinnerMenu;
    }
    /*
    kcalDiv.innerHTML = this.kcal;
    originDiv.innerHTML = this.origins;
    nutriDiv.innerHTML = this.nutritions;
    menuInfoDiv.append(kcalDiv, originDiv);
    */
   
    mealIndexDiv.append(lunchIndexDiv, dinnerIndexDiv);
    menuDiv.append(lunchDiv, dinnerDiv);
    mainDiv.append(mealIndexDiv, menuDiv);
    return mainDiv;
  }
});