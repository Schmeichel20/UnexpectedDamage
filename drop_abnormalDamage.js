/**
 * 異常ダメ検知
 * @version 0.2.5.1β
 * @author Nishisonic
 */

load("script/ScriptData.js");

ComparableArrayType = Java.type("java.lang.Comparable[]");
AppConstants = Java.type("logbook.constants.AppConstants");
LinkedList = Java.type("java.util.LinkedList");
BattleExDto = Java.type("logbook.dto.BattleExDto");
BattlePhaseKind = Java.type("logbook.dto.BattlePhaseKind");
ShipDto = Java.type("logbook.dto.ShipDto");
Collectors = Java.type("java.util.stream.Collectors");
Paths = Java.type("java.nio.file.Paths");
Files = Java.type("java.nio.file.Files");
StandardOpenOption = Java.type("java.nio.file.StandardOpenOption");
PrintWriter = Java.type("java.io.PrintWriter");
System = Java.type("java.lang.System");
SimpleDateFormat = Java.type("java.text.SimpleDateFormat");
StandardCharsets = Java.type("java.nio.charset.StandardCharsets");
Calendar = Java.type("java.util.Calendar");
TimeZone = Java.type("java.util.TimeZone");
EnemyShipDto = Java.type("logbook.dto.EnemyShipDto");
DataType = Java.type("logbook.data.DataType");
IOUtils = Java.type("org.apache.commons.io.IOUtils");
Charset = Java.type("java.nio.charset.Charset");
URI = Java.type("java.net.URI");
URL = Java.type("java.net.URL");
HttpURLConnection = Java.type("java.net.HttpURLConnection");
StandardCopyOption = Java.type("java.nio.file.StandardCopyOption");
ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream");

var UPDATE_CHECK_URL = "https://raw.githubusercontent.com/Nishisonic/AbnormalDamage/master/update.txt";
var FILE_URL = "https://raw.githubusercontent.com/Nishisonic/AbnormalDamage/master/drop_abnormalDamage.js";
var EXECUTABLE_FILE = "script/drop_AbnormalDamage.js";
var SETTING_FILE = "script/setting_AbnormalDamage.json";
var LOG_FILE = "AbnormalDamage.log";
var VERSION = 0.251;
data_prefix = "AbnormalDamage_";

var MODE = {
    /** 設定用コメント */
    ___COMMENT___:"設定の詳細はプログラムコードを参照して下さい",
    /** 厳密に測ります。(1ダメでもずれたら検知します) falseにした場合、1ダメージは許容します。 */
    STRICT:false,
    /**
     * 熟練度補正のかかった砲撃も測るか[空母用]
     * (=空母のクリティカル砲撃を測るか)
     */
    SKILLED:false,
    /** 演習も測るか */
    PLACTICE:false,
    /** うずしおマップも測るか */
    MAELSTROM:false,
    /** 味方からの攻撃に限定するか */
    FRIENDS_ATTACK_ONLY:false,
    /** 敵からの攻撃に限定するか */
    ENEMY_ATTACK_ONLY:false,
    /** 陸上敵を測るか */
    LAND:true,
    /** 弾着観測射撃を測るか */
    SPOTTING:true,
    /** 徹甲弾補正を測るか */
    AP_SHELL:true,
    /** PT小鬼群を測るか */
    PT:true,
    /** クリティカルを測るか */
    CRITICAL:true,
    /** イベント海域を測るか */
    EVENT:true,
    /**
     * 交戦形態フィルター
     * この配列に入っている形態のみ判定します。
     * 1:同航戦
     * 2:反航戦
     * 3:T字有利
     * 4:T字不利
     */
    FORMATION_MATCH:[1,2,3,4],
    /**
     * 表示設定
     * 1:「?」のみ
     * 2:想定値より上だったら「+」、想定値より下だったら「-」を表示
     * 3:想定値オーバーの値を表示 例:「+4」
     * 4:詳細ログ表示 例:「夕立改二->深海双子棲姫-壊 dmg:44 想定+2」
     */
    DISP:1,
    /**
     * 昼戦の最終攻撃力の計算式を仮説ver.に変えるか
     * (STRICT:true推奨)
     */
    HYPOTHESIS_ATK:false,
    /**
     * 自動更新するか
     */
    AUTO_UPDATE:true,
    /**
     * ログを吐き出すか
     */
    LOG:true,
    /**
     * 調べる期間
     * FROM_PERIOD:下限
     * UNTIL_PERIOD:上限
     * 見方について
     * XXX_PERIOD:[年,月,日,時,分,秒]
     * 例:2017冬イベの期間で調べたいとき
     * FROM_PERIOD:[2017,2,11,21,30,0],
     * UNTIL_PERIOD:[2017,2,28,11,0,0]
     */
    FROM_PERIOD:[0,1,1,0,0,0],
    UNTIL_PERIOD:[9999,12,31,23,59,59],
    /**
     * 調べるのを除外したいマップ
     * 例:3-5→[3,5]、出撃！北東方面 第五艦隊のE-5→[38,5]
     */
    EXCEPTION_MAP:[
        // 例
        [0,0],
    ],
    /**
     * 対潜攻撃を測定するか
     */
    TAISEN:false,
    /**
     * 対潜攻撃のみを測定するか
     */
    TAISEN_ONLY:false,
    /**
     * 指定されたIDの攻撃艦種のみ測定します。
     * nullでoff
     * 配列時でon
     * 
     * 例:駆逐艦と軽巡洋艦のみ調べたいとき
     * SHIP_TYPE_FILTER:[2,3]
     */
    SHIP_TYPE_FILTER:null,
    /**
     * 指定されたIDの装備を1つ以上積んでいる攻撃艦のみ測定します。
     * nullでoff
     * 配列時でon
     * 
     * 例:大発系統を積んでいる艦を調べたいとき
     * ITEM_ID_FILTER:[68,166,167,193,230]
     */
    ITEM_ID_FILTER:null,
    /**
     * 通常、異常含めた全攻撃のログを吐き出すか。
     */
    FULL_LOG:false,
    /**
     * 指定されたlv以上の攻撃艦のみ測定します。
     * nullでoff
     * 数値でon
     * 
     * 例:バイト艦を省きたいとき
     * SHIP_LV_FILTER:3
     */
    SHIP_LV_FILTER:null,
};

// 変更禁止
var crlf = System.getProperty("line.separator");
var dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
var CHANGE_CAP_DATE = getJstCalendar(2017, 3, 17, 12, 0, 0).getTime();
var CHANGE_ID_DATE = getJstCalendar(2017, 4, 5, 12, 0, 0).getTime();
var CHANGE_SUB_GUN_BONUS_DATE = getJstCalendar(2017, 3, 17, 12, 0, 0).getTime();
var RETURN_TO_ORIGINAL_SUB_GUN_BONUS_DATE = getJstCalendar(2017, 5, 2, 12, 0, 0).getTime();
var ADD_CL_LIGHT_GUN_BONUS_DATE = getJstCalendar(2015, 6, 13, 12, 0, 0).getTime();
var ADD_TRANSPORTATION_FORCE_DATE = getJstCalendar(2015,11,18,12, 0, 0).getTime();

var MAELSTROM_MAP_LIST = [
    [1,3],
    [3,2],
    [3,3],
    [3,4],
    [4,3],
    [4,4],
    [6,2],
    [22,1],
    [22,3],
    [23,3],
    [24,2],
    [24,4],
    [24,5],
    [25,2],
];

function header() {
    return ["砲撃","雷撃","夜戦"];
}

function begin() {
    loadSetting();
    if(getData("MODE").LOG){
        iniFile();
    }
    updateFile();
}

// 基本的にjavascriptは遅いので注意
// なるべくJavaの型を使って型変換が起こらないようにすべし
// パフォーマンス例
// 56,038件の出撃ログの読み込みにかかった時間(Java 1.8.0_31使用時)
// このスクリプトを使わなかった時: 12,425ms
// javascriptの配列を返した場合: 24,820ms（+12,395ms）
// Javaの配列を返した場合: 14,457ms（+2,032ms）
// javascriptの配列を使うと型変換が必要になってスクリプトの動作速度が5倍以上遅くなる

function body(battle) {
    var result = {
        /** 砲撃戦 */
        hougeki:null,
        /** 雷撃戦 */
        raigeki:null,
        /** 夜戦 */
        yasen:null,
    };
    var date = battle.getBattleDate();
    var ret = new ComparableArrayType(3);
    // -----
    // 途中でnullになる防止策
    var fromDate = getJstCalendar(getData("MODE").FROM_PERIOD[0],getData("MODE").FROM_PERIOD[1],getData("MODE").FROM_PERIOD[2],getData("MODE").FROM_PERIOD[3],getData("MODE").FROM_PERIOD[4],getData("MODE").FROM_PERIOD[5]).getTime();
    var untilDate = getJstCalendar(getData("MODE").UNTIL_PERIOD[0],getData("MODE").UNTIL_PERIOD[1],getData("MODE").UNTIL_PERIOD[2],getData("MODE").UNTIL_PERIOD[3],getData("MODE").UNTIL_PERIOD[4],getData("MODE").UNTIL_PERIOD[5]).getTime();
    if(battle.getExVersion() >= 2
        && !((!getData("MODE").MAELSTROM && !battle.isPractice() && isMaelstromMap(battle)) || (!getData("MODE").PLACTICE && battle.isPractice()) || (!getData("MODE").EVENT && !battle.isPractice() && battle.getMapCellDto().getMap()[0] >= 22))
        && !isException(battle)
        && ((fromDate.before(date) && untilDate.after(date)) || (fromDate.equals(date) || untilDate.equals(date)))){
        var isCombined = battle.isCombined();
        var isEnemyCombined = battle.isEnemyCombined();
        var friends = new LinkedList(battle.getDock().getShips());
        for(var i = friends.size();i < 6;i++) friends.add(null);
        if(isCombined) friends.addAll(battle.getDockCombined().getShips());
        //var enemy = new LinkedList(battle.getEnemy());
        //for(var i = enemy.size();i < 6;i++) enemy.add(null);
        //if(isEnemyCombined) enemy.addAll(battle.getEnemyCombined());
        var enemy = getEnemy(battle);
        var maxFriendHp = Java.from(battle.getMaxFriendHp()).concat(new Array(6-battle.getMaxFriendHp().length),isCombined ? Java.from(battle.getMaxFriendHpCombined()) : new Array(0));
        var maxEnemyHp = Java.from(battle.getMaxEnemyHp()).concat(new Array(6-battle.getMaxEnemyHp().length),isEnemyCombined ? Java.from(battle.getMaxEnemyHpCombined()) : new Array(0));
        var friendHp = Java.from(battle.getStartFriendHp()).concat(new Array(6-battle.getStartFriendHp().length),isCombined ? Java.from(battle.getStartFriendHpCombined()) : new Array(0));
        var enemyHp = Java.from(battle.getStartEnemyHp()).concat(new Array(6-battle.getStartEnemyHp().length),isEnemyCombined ? Java.from(battle.getStartEnemyHpCombined()) : new Array(0));
        var formationMatch = fromFormationMatch(battle.getFormationMatch());
        var formations = fromFormations(battle.getFormation());
        var friendCombinedKind = battle.isCombined() ? (battle.getCombinedKind() > 0 ? battle.getCombinedKind() : calcCombinedKind(battle)) : 0;
        var enemyCombinedKind = battle.isEnemyCombined() ? 1 : 0;
        genDayBattle(battle,result,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind);
        genNightBattle(battle,result,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind);
    }
    ret[0] = toDispString(result.hougeki);
    ret[1] = toDispString(result.raigeki);
    ret[2] = toDispString(result.yasen);
    return ret;
    /*
    for(var i in battle.getPhaseList()){
        var phase = battle.getPhaseList().get(i);
        phase.isNight() 
    }*/
}

function end() { }

function genNightBattle(battle,result,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind){
    // 夜戦のフェーズを取得
    var nightPhase = battle.getPhaseList().stream().filter(function(phase){
        return phase.isNight();
    }).findFirst().orElse(null);
    if(nightPhase == null) return result;
    // 夜戦
    var yasen = nightPhase.getHougeki();
    if(yasen != null && friendCombinedKind >= 0){
        result.yasen = genAbnormalYasenDamage(yasen,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,nightPhase.getTouchPlane(),nightPhase.getJson(),battle);
    }
}

// 昼戦処理
function genDayBattle(battle,result,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind){
    // 昼戦のフェーズを取得
    var dayPhase = battle.getPhaseList().stream().filter(function(phase){
        return !phase.isNight();
    }).findFirst().orElse(null);
    if(dayPhase == null) return result;

    var date = battle.getBattleDate();

    // 基地航空隊(噴式)
    var airBaseInjection = dayPhase.getAirBaseInjection();
    if(airBaseInjection != null){
        genAirBattle(airBaseInjection,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy);
    }
    // 航空戦(噴式)
    var airInjection = dayPhase.getAirInjection();
    if(airInjection != null){
        genAirBattle(airInjection,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy);
    }
    // 基地航空隊
    var airBaseList = dayPhase.getAirBase();
    if(airBaseList != null){
        airBaseList.forEach(function(airBase){
            genAirBattle(airBase,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy);
        });
    }
    // 航空戦
    var air = dayPhase.getAir();
    if(air != null){
        genAirBattle(air,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy);
    }
    var air2 = dayPhase.getAir2();
    if(air2 != null){
        genAirBattle(air2,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy);
    }
    
    // 支援攻撃
    var supportAttack = dayPhase.getSupport();
    if(supportAttack != null){
        genSupportAttack(supportAttack,friendHp,enemyHp);
    }

    var raigekiOrder = getRaigekiOrder(dayPhase.getKind());

    // print(friendCombinedKind,enemyCombinedKind)
    // 対潜先制爆雷攻撃
    var openingTaisen = dayPhase.getOpeningTaisen();
    if(openingTaisen != null && friendCombinedKind >= 0){
        var _result = genAbnormalHougekiDamage(openingTaisen,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,date,true,battle);
        if(result.hougeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.hougeki.match(/\d+$/g)))))) result.hougeki = _result;
    }
    // 開幕雷撃
    var openingRaigeki = dayPhase.getOpening();
    if(openingRaigeki != null && friendCombinedKind >= 0){
        var _result = genAbnormalRaigekiDamage(openingRaigeki,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,battle);
        if(result.raigeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.raigeki.match(/\d+$/g)))))) result.raigeki = _result;
    }
    // 砲撃戦
    var hougeki1 = dayPhase.getHougeki1();
    if(hougeki1 != null && friendCombinedKind >= 0){
        var _result = genAbnormalHougekiDamage(hougeki1,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,date,false,battle);
        if(result.hougeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.hougeki.match(/\d+$/g)))))) result.hougeki = _result;
    }
    // 雷撃戦
    var raigeki = dayPhase.getRaigeki();
    if(raigeki != null && friendCombinedKind >= 0 && raigekiOrder == 1){
        var _result = genAbnormalRaigekiDamage(raigeki,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,battle);
        if(result.raigeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.raigeki.match(/\d+$/g)))))) result.raigeki = _result;
    }
    var hougeki2 = dayPhase.getHougeki2();
    if(hougeki2 != null && friendCombinedKind >= 0){
        var _result = genAbnormalHougekiDamage(hougeki2,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,date,false,battle);
        if(result.hougeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.hougeki.match(/\d+$/g)))))) result.hougeki = _result;
    }
    if(raigeki != null && friendCombinedKind >= 0 && raigekiOrder == 2){
        var _result = genAbnormalRaigekiDamage(raigeki,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,battle);
        if(result.raigeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.raigeki.match(/\d+$/g)))))) result.raigeki = _result;
    }
    var hougeki3 = dayPhase.getHougeki3();
    if(hougeki3 != null && friendCombinedKind >= 0){
        var _result = genAbnormalHougekiDamage(hougeki3,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,date,false,battle);
        if(result.hougeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.hougeki.match(/\d+$/g)))))) result.hougeki = _result;
    }
    if(raigeki != null && friendCombinedKind >= 0 && raigekiOrder == -1){
        var _result = genAbnormalRaigekiDamage(raigeki,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedKind,enemyCombinedKind,battle);
        if(result.raigeki == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.raigeki.match(/\d+$/g)))))) result.raigeki = _result;
    }
}

/**
 * 雷撃異常ダメージを検知します。
 * 
 * @param {*} atacks 
 * @param {*} friends 
 * @param {*} enemy 
 * @param {*} maxFriendHp 
 * @param {*} maxEnemyHp 
 * @param {*} friendHp 
 * @param {*} enemyHp 
 * @param {*} formationMatch 
 * @param {*} formations 
 * @param {*} friendCombinedKind 
 * @param {*} enemyCombinedKind 
 */
function genAbnormalRaigekiDamage(atacks,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedType,enemyCombinedType,battle){
    var _genAbnormalRaigekiDamage = function(origin,target,targetIdx,targetHp,damage,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical){
        var oItem2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) oItem2.add(origin.slotExItem);
        var tItem2 = new LinkedList(target.item2);
        if(target instanceof ShipDto) tItem2.add(target.slotExItem);
        if((isFriend ? getData("MODE").ENEMY_ATTACK_ONLY : getData("MODE").FRIENDS_ATTACK_ONLY) || 
            (!getData("MODE").PT && isPt(target)) || 
            (!getData("MODE").CRITICAL && isCritical(critical)) || 
            (!getData("MODE").FORMATION_MATCH.some(function(e){ return e == formationMatch; })) || 
            (getData("MODE").TAISEN_ONLY) ||
            (getData("MODE").SHIP_TYPE_FILTER != null && !getData("MODE").SHIP_TYPE_FILTER.some(function(x){ return x == origin.stype; })) ||
            (getData("MODE").ITEM_ID_FILTER != null && !getData("MODE").ITEM_ID_FILTER.some(function(x){ return oItem2.stream().anyMatch(function(i){ return i != null && i.slotitemId == x }); })) ||
            (getData("MODE").SHIP_LV_FILTER != null && !(getData("MODE").SHIP_LV_FILTER <= origin.lv))) return null;
        var raigekiPower = getRaigekiPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp);
        var finalRaigekiPower = Math.floor(Math.floor(raigekiPower) * (isCritical(critical) ? getCriticalBonus(critical) : 1.0));
        var minDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 0.7;
        var maxDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 1.3 - 0.6;
        var minDmg = Math.floor((finalRaigekiPower - maxDefensePower) * getAmmoBonus(origin,isFriend));
        var maxDmg = Math.floor((finalRaigekiPower - minDefensePower) * getAmmoBonus(origin,isFriend));
        var minPropDmg = Math.floor(targetHp * 0.06);
        var maxPropDmg = Math.floor(targetHp * 0.14 - 0.08);
        var minSunkDmg = Math.floor(targetHp * 0.5);
        var maxSunkDmg = Math.floor(targetHp * 0.8 - 0.3);
        var isHp1Obj = (targetHp - damage == 1) && isHp1ReplacementObj(target,targetIdx);
        
        var _isAbnormalDamage = isAbnormalDamage(damage,minDmg,maxDmg,minPropDmg,maxPropDmg,targetHp,minSunkDmg,maxSunkDmg,isFriend,isHp1Obj);
        if((_isAbnormalDamage || getData("MODE").FULL_LOG) && getData("MODE").LOG){
            var writeData = "";
            writeData += "日付:" + dateFormat.format(battle.getBattleDate()) + crlf;
            writeData += "戦闘場所:" + (battle.isPractice() ? "演習" : (battle.getMapCellDto().getMap()[0] + "-" + battle.getMapCellDto().getMap()[1] + "-" + battle.getMapCellDto().getMap()[2])) + crlf;
            writeData += "艦隊:味方->" + toFriendCombinedKindString(friendCombinedKind) + " 敵->" + toEnemyCombinedKindString(enemyCombinedKind) + " 連合艦隊補正:" + getCombinedRaigekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend) + crlf;
            writeData += "交戦形態:" + toFormationMatchString(formationMatch) + " 攻撃側陣形:" + toFormationString(formation,true) + crlf;
            writeData += "雷撃:" + origin.fullName + "[雷装(装備含):" + origin.raisou + ",改修火力:" + getRaigekiKaishuPower(oItem2).toFixed(1) + "] -> " + target.fullName + "[装甲(装備含):" + target.soukou + ",バルジ改修ボーナス:" + getBulgeBonus(target.item2) + ",HP:" + targetHp + "-" + damage + "=>" + (targetHp-damage) + "]" + ((maxDmg >= damage && damage >= minDmg) ? "(想定内Dmg.)" : "(想定:" + (damage > maxDmg ? "+" + (damage - maxDmg) : "-" + (minDmg - damage)) + ")") + crlf;
            writeData += "攻撃->" + ('0000' + origin.getShipId()).slice(-4) + ":" + origin.fullName + crlf;
            writeData += toSlotString(origin);
            writeData += "防御->" + ('0000' + target.getShipId()).slice(-4) + ":" + target.fullName + crlf;
            writeData += toSlotString(target);
            writeData += "耐久:" + nowOriginHp + " / " + maxOriginHp + " (" + toHPStateString(maxOriginHp,nowOriginHp) + ",x" + getHPPowerBonus(maxOriginHp,nowOriginHp,false).toFixed(1) + ") 弾薬:" + (isFriend ? (origin.bull + " / " + origin.bullMax + " (" + (origin.bull / origin.bullMax * 100).toFixed() + "%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") : "? / ? (100%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") + crlf;
            writeData += "クリティカル:" + (isCritical(critical) ? "あり(x1.5)" : "なし(x1.0)") + crlf;
            writeData += "雷撃火力:" + raigekiPower.toFixed(1) + " 最終雷撃火力:" + finalRaigekiPower.toFixed(1) + crlf;
            writeData += "防御力範囲:" + minDefensePower.toFixed(1) + " - " + maxDefensePower.toFixed(1) + crlf;
            writeData += "想定通常dmg:" + minDmg + " - " + maxDmg + crlf;
            writeData += "想定割合dmg:" + minPropDmg + " - " + maxPropDmg + crlf;
            writeData += "想定轟スdmg:" + minSunkDmg + " - " + maxSunkDmg + crlf;
            write(writeData);
        }
        if(_isAbnormalDamage){
            return origin.fullName + "→" + target.fullName + " dmg:" + damage + " 想定:" + (minDmg - damage > 0 ? ("-" + (minDmg - damage)) : ("+" + (damage - maxDmg)));
        }
        return null;
    }

    var atackList = atacks.stream().collect(Collectors.partitioningBy(function(atack){return atack.friendAtack; }));
    var tmpFriendHp = friendHp.concat();
    var tmpEnemyHp = enemyHp.concat();
    // フレンズ
    var isFriendAbnormalDamage = function(){
        var result = null;
        for(var i = 0;i < atackList.get(true).size();i++){
            var atack = atackList.get(true).get(i);
            var origins = friends;
            var maxOriginHp = maxFriendHp;
            var nowOriginHp = friendHp;
            var targets = enemy;
            var targetHp = tmpEnemyHp;
            var formation = formations[0];
            for(var j = 0;j < atack.ot.length;j++){
                var x = atack.ot[j];
                var originIdx = atack.origin[j];
                var targetIdx = atack.target[x];
                var origin = origins.get(originIdx);
                var target = targets.get(targetIdx);
                var critical = atack.critical != null ? atack.critical[j] : 0;
                var _result = _genAbnormalRaigekiDamage(
                    origin,
                    target,
                    targetIdx,
                    targetHp[targetIdx],
                    atack.ydam[j],
                    formationMatch,
                    formation,
                    toCombinedKind(friendCombinedType,originIdx),
                    toCombinedKind(enemyCombinedType,targetIdx),
                    true,
                    maxOriginHp[originIdx],
                    nowOriginHp[originIdx],
                    critical);
                if(result == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.match(/\d+$/g)))))){
                    result = _result;
                }
                targetHp[targetIdx] -= atack.ydam[j];
            }
        }
        return result;
    }();
    // セルリアン
    var isEnemyAbnormalDamage = function(){
        var result = null;
        for(var i = 0;i < atackList.get(false).size();i++){
            var atack = atackList.get(false).get(i);
            var origins = enemy;
            var maxOriginHp = maxEnemyHp;
            var nowOriginHp = enemyHp;
            var targets = friends;
            var targetHp = tmpFriendHp;
            var formation = formations[1];
            for(var j = 0;j < atack.ot.length;j++){
                var x = atack.ot[j];
                var originIdx = atack.origin[j];
                var targetIdx = atack.target[x];
                var origin = origins.get(originIdx);
                var target = targets.get(targetIdx);
                var critical = atack.critical != null ? atack.critical[j] : 0;
                var _result = _genAbnormalRaigekiDamage(
                    origin,
                    target,
                    targetIdx,
                    targetHp[targetIdx],
                    atack.ydam[j],
                    formationMatch,
                    formation,
                    toCombinedKind(friendCombinedType,targetIdx),
                    toCombinedKind(enemyCombinedType,originIdx),
                    false,
                    maxOriginHp[originIdx],
                    nowOriginHp[originIdx],
                    critical);
                if(result == null || (_result != null && (Number(_result.match(/\d+$/g) > Number(result.match(/\d+$/g)))))){
                    result = _result;
                }
                targetHp[targetIdx] -= atack.ydam[j];
            }
        }
        return result;
    }();
    // ダメージ処理
    atacks.forEach(function(atack){
        var targetHp;
        if(atack.friendAtack){
            targetHp = enemyHp;
        } else {
            targetHp = friendHp;
        }
        Java.from(atack.ot).forEach(function(x,i,a){
            var targetIdx = atack.target[x];
            targetHp[targetIdx] -= atack.ydam[i];
        });
    });
    // フレンズ
    for(var targetIdx = 0;targetIdx < friendHp.length;targetIdx++){
        if(friendHp[targetIdx] <= 0){
            var target = friends.get(targetIdx);
            for(var k = 0;k < target.item2.size();k++){
                var item = target.item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        friendHp[targetIdx] = Math.floor(maxFriendHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        friendHp[targetIdx] = maxFriendHp[targetIdx];
                        // 攻撃側が自軍側でなければ、弾薬も回復
                        target.bull = target.bullMax;
                        break;
                    }
                }
            }
        }
    }
    // セルリアン
    for(var targetIdx = 0;targetIdx < enemyHp.length;targetIdx++){
        if(enemyHp[targetIdx] <= 0){
            var target = enemy.get(targetIdx);
            for(var k = 0;k < target.item2.size();k++){
                var item = target.item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        enemyHp[targetIdx] = Math.floor(maxEnemyHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        enemyHp[targetIdx] = maxEnemyHp[targetIdx];
                        break;
                    }
                }
            }
        }
    }
    return (isFriendAbnormalDamage == null && isEnemyAbnormalDamage == null) ? null : (isFriendAbnormalDamage != null ? isFriendAbnormalDamage : isEnemyAbnormalDamage);
}

/**
 * 
 * @param {java.util.List<BattleAtackDto>} atacks 
 * @param {java.util.List<ShipDto>} friends 
 * @param {java.util.List<EnemyShipDto>} enemy 
 * @param {Number[]} maxFriendHp 
 * @param {Number[]} maxEnemyHp 
 * @param {Number[]} friendHp 
 * @param {Number[]} enemyHp 
 * @param {Boolean} isOpening 
 * @param {Number[]} formationMatch 
 * @param {Number[]} formations 
 * @param {Number} friendCombinedKind 
 * @param {Number} enemyCombinedKind 
 */
function genAbnormalHougekiDamage(atacks,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedType,enemyCombinedType,date,isOpeningTaisen,battle){
    var _genAbnormalHougekiDamage = function(origin,target,targetIdx,targetHp,damage,hougekiType,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical,date){
        var stype = target.getStype();
        var oItem2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) oItem2.add(origin.slotExItem);
        var tItem2 = new LinkedList(target.item2);
        if(target instanceof ShipDto) tItem2.add(target.slotExItem);
        // 対潜攻撃
        if(stype == 13 || stype == 14) return genAbnormalTaisenDamage(origin,target,targetIdx,targetHp,damage,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical,isOpeningTaisen,false,battle);
        if((getHougekiKind(origin) == 7 && getSkilledBonus(origin,critical,false) > 1 && !getData("MODE").SKILLED) ||
            (isFriend ? getData("MODE").ENEMY_ATTACK_ONLY : getData("MODE").FRIENDS_ATTACK_ONLY) ||
            (!getData("MODE").LAND && target.param.soku == 0) ||
            (!getData("MODE").SPOTTING && getSpottingBonus(hougekiType) != 1) ||
            (!getData("MODE").PT && isPt(target)) ||
            (!getData("MODE").AP_SHELL && getAPshellBonus(origin,target) > 1) ||
            (!getData("MODE").CRITICAL && isCritical(critical)) ||
            (!getData("MODE").FORMATION_MATCH.some(function(e){ return e == formationMatch; })) ||
            (getData("MODE").TAISEN_ONLY) ||
            (getData("MODE").SHIP_TYPE_FILTER != null && !getData("MODE").SHIP_TYPE_FILTER.some(function(x){ return x == origin.stype; })) ||
            (getData("MODE").ITEM_ID_FILTER != null && !getData("MODE").ITEM_ID_FILTER.some(function(x){ return oItem2.stream().anyMatch(function(i){ return i != null && i.slotitemId == x }); })) ||
            (getData("MODE").SHIP_LV_FILTER != null && !(getData("MODE").SHIP_LV_FILTER <= origin.lv))) return null;
        // 砲撃
        var hougekiPower = getHougekiPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,date);
        // 従来式
        // [[[キャップ後火力*集積地棲姫特効]*徹甲弾補正*北端上陸姫乗算特効+北端上陸姫加算特効]*クリティカル補正*熟練度補正]*弾着観測射撃補正*PT小鬼群特効
        var minFinalHougekiPower = Math.floor(Math.floor(Math.floor(hougekiPower * getShusekiBonus(origin,target)) * getAPshellBonus(origin,target) * getHokutanMultiplyBonus(origin,target) + getHokutanAddBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,true)) * getSpottingBonus(hougekiType) * getPtBonus(origin,target);
        var maxFinalHougekiPower = Math.floor(Math.floor(Math.floor(hougekiPower * getShusekiBonus(origin,target)) * getAPshellBonus(origin,target) * getHokutanMultiplyBonus(origin,target) + getHokutanAddBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,false)) * getSpottingBonus(hougekiType) * getPtBonus(origin,target);
        // 仮説:最終攻撃力
        if(getData("MODE").HYPOTHESIS_ATK){
            if(isAPshellBonusTarget(target.stype)){
                // 「装甲の厚い敵大型艦艇」及び「地上施設」
                // 最終攻撃力 = [[[[キャップ後火力*集積地棲姫特効]*北端上陸姫乗算特効+北端上陸姫加算特効]*弾着観測射撃補正*徹甲弾補正]*クリティカル補正*熟練度補正]
                minFinalHougekiPower = Math.floor(Math.floor(Math.floor(Math.floor(hougekiPower * getShusekiBonus(origin,target)) * getHokutanMultiplyBonus(origin,target) + getHokutanAddBonus(origin,target)) * getSpottingBonus(hougekiType) * getAPshellBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,true));
                maxFinalHougekiPower = Math.floor(Math.floor(Math.floor(Math.floor(hougekiPower * getShusekiBonus(origin,target)) * getHokutanMultiplyBonus(origin,target) + getHokutanAddBonus(origin,target)) * getSpottingBonus(hougekiType) * getAPshellBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,false));
            } else if(isCritical(critical) && getSpottingBonus(hougekiType) > 1){
                // クリティカルかつ弾着観測射撃
                // 最終攻撃力 = [[キャップ後火力*PT小鬼群特効]*クリティカル補正*弾着観測射撃補正]
                minFinalHougekiPower = maxFinalHougekiPower = Math.floor(Math.floor(hougekiPower * getPtBonus(origin,target)) * getCriticalBonus(critical) * getSpottingBonus(hougekiType));
            } else {
                // それ以外
                // 最終攻撃力 = [[キャップ後攻撃力*PT小鬼群特効]*クリティカル補正*熟練度補正]*弾着観測射撃補正
                minFinalHougekiPower = Math.floor(Math.floor(hougekiPower * getPtBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,true)) * getSpottingBonus(hougekiType);
                maxFinalHougekiPower = Math.floor(Math.floor(hougekiPower * getPtBonus(origin,target)) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,false)) * getSpottingBonus(hougekiType);
            }/*
            if(getHougekiKind(origin) == 7){
                if(isAPshellBonusTarget(target.stype)){
                    minFinalHougekiPower = Math.floor(Math.floor(hougekiPower) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,true));
                    maxFinalHougekiPower = Math.floor(Math.floor(hougekiPower) * getCriticalBonus(critical) * getSkilledBonus(origin,critical,false));
                } else {
                    minFinalHougekiPower = Math.floor(Math.floor(hougekiPower) * getSkilledBonus(origin,critical,true) * getCriticalBonus(critical));
                    maxFinalHougekiPower = Math.floor(Math.floor(hougekiPower) * getSkilledBonus(origin,critical,false) * getCriticalBonus(critical));
                }
            }*/
        }
        var minDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 0.7;
        var maxDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 1.3 - 0.6;
        var minDmg = Math.floor((minFinalHougekiPower - maxDefensePower) * getAmmoBonus(origin,isFriend));
        var maxDmg = Math.floor((maxFinalHougekiPower - minDefensePower) * getAmmoBonus(origin,isFriend));
        var minPropDmg = Math.floor(targetHp * 0.06);
        var maxPropDmg = Math.floor(targetHp * 0.14 - 0.08);
        var minSunkDmg = Math.floor(targetHp * 0.5);
        var maxSunkDmg = Math.floor(targetHp * 0.8 - 0.3);
        var isHp1Obj = (targetHp - damage == 1) && isHp1ReplacementObj(target,targetIdx);

        var _isAbnormalDamage = isAbnormalDamage(damage,minDmg,maxDmg,minPropDmg,maxPropDmg,targetHp,minSunkDmg,maxSunkDmg,isFriend,isHp1Obj);
        if((_isAbnormalDamage || getData("MODE").FULL_LOG) && getData("MODE").LOG){
            var writeData = "";
            writeData += "日付:" + dateFormat.format(battle.getBattleDate()) + crlf;
            writeData += "戦闘場所:" + (battle.isPractice() ? "演習" : (battle.getMapCellDto().getMap()[0] + "-" + battle.getMapCellDto().getMap()[1] + "-" + battle.getMapCellDto().getMap()[2])) + crlf;
            writeData += "艦隊:味方->" + toFriendCombinedKindString(friendCombinedKind) + " 敵->" + toEnemyCombinedKindString(enemyCombinedKind) + " 連合艦隊補正:" + getCombinedHougekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend) + crlf;
            writeData += "交戦形態:" + toFormationMatchString(formationMatch) + " 攻撃側陣形:" + toFormationString(formation) + crlf;
            writeData += "砲撃:" + origin.fullName + "[火力(装備含):" + origin.karyoku + ",改修火力:" + getHougekiKaishuPower(oItem2,date).toFixed(1) + ",空母用->雷装:" + origin.slotParam.raig + ",爆装:" + origin.slotParam.baku + "] -> " + target.fullName + "[装甲(装備含):" + target.soukou + ",バルジ改修ボーナス:" + getBulgeBonus(target.item2) + ",HP:" + targetHp + "-" + damage + "=>" + (targetHp-damage) + "]" + ((maxDmg >= damage && damage >= minDmg) ? "(想定内Dmg.)" : "(想定:" + (damage > maxDmg ? "+" + (damage - maxDmg) : "-" + (minDmg - damage)) + ")") + crlf;
            writeData += "攻撃->" + ('0000' + origin.getShipId()).slice(-4) + ":" + origin.fullName + crlf;
            writeData += toSlotString(origin);
            writeData += "防御->" + ('0000' + target.getShipId()).slice(-4) + ":" + target.fullName + crlf;
            writeData += toSlotString(target);
            writeData += "耐久:" + nowOriginHp + " / " + maxOriginHp + " (" + toHPStateString(maxOriginHp,nowOriginHp) + ",x" + getHPPowerBonus(maxOriginHp,nowOriginHp,false).toFixed(1) + ") 弾薬:" + (isFriend ? (origin.bull + " / " + origin.bullMax + " (" + (origin.bull / origin.bullMax * 100).toFixed() + "%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") : "? / ? (100%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") + crlf;
            writeData += "陸上特効:x" + getLandBonus(origin,target).toFixed(1) + " WG42加算特効:+" + getWGBonus(origin,target) + " 軽巡軽量砲補正:+" + getCLLightGunPowerBonus(origin,date).toFixed(1) + " Zara砲フィット補正:+" + getZaraGunFitPowerBonus(origin).toFixed(1) + crlf;
            writeData += "集積地特効:x" + getShusekiBonus(origin,target).toFixed(2) + " 徹甲弾補正:x" + getAPshellBonus(origin,target).toFixed(2) + " PT小鬼補正:x" + getPtBonus(origin,target).toFixed(1) + crlf;
            writeData += "北端上陸姫乗算特効:x" + getHokutanMultiplyBonus(origin,target).toFixed(2) + " 北端上陸姫加算特効:+" + getHokutanAddBonus(origin,target) + crlf;
            writeData += "砲撃攻撃種別:" + toSpottingKindString(hougekiType) + crlf;
            writeData += "クリティカル:" + (isCritical(critical) ? "あり(x1.5)" : "なし(x1.0)") + crlf;
            writeData += "熟練度倍率:x" + getSkilledBonus(origin,2,true).toFixed(3) + " - x" + getSkilledBonus(origin,2,false).toFixed(3) + crlf;
            writeData += "砲撃火力:" + hougekiPower.toFixed(1) + " 最終砲撃火力:" + minFinalHougekiPower.toFixed(1) + " - " + maxFinalHougekiPower.toFixed(1) + crlf;
            writeData += "防御力範囲:" + minDefensePower.toFixed(1) + " - " + maxDefensePower.toFixed(1) + crlf;
            writeData += "想定通常dmg:" + minDmg + " - " + maxDmg + crlf;
            writeData += "想定割合dmg:" + minPropDmg + " - " + maxPropDmg + crlf;
            writeData += "想定轟スdmg:" + minSunkDmg + " - " + maxSunkDmg + crlf;
            write(writeData);
        }
        if(_isAbnormalDamage){
            return origin.fullName + "→" + target.fullName + " dmg:" + damage + " 想定:" + (minDmg - damage > 0 ? ("-" + (minDmg - damage)) : ("+" + (damage - maxDmg)));
        }
        return null;

    };
    var _isAbnormalDamage = null;
    for(var i = 0;i < atacks.size();i++){
        var atack = atacks.get(i);
        var isFriend = atack.friendAtack;
        var origin;
        var originIdx = atack.origin[0];
        var maxOriginHp;
        var nowOriginHp;
        var target;
        var targetHp;
        var targetIdx = atack.target[0];
        var isTouch;
        if(atack.friendAtack){
            origin = friends.get(originIdx);
            maxOriginHp = maxFriendHp[originIdx];
            nowOriginHp = friendHp[originIdx];
            target = enemy.get(targetIdx);
            targetHp = enemyHp;
        }
        else {
            origin = enemy.get(originIdx);
            maxOriginHp = maxEnemyHp[originIdx];
            nowOriginHp = enemyHp[originIdx];
            target = friends.get(targetIdx);
            targetHp = friendHp;
        }
        
        for(var j = 0;j < atack.damage.length;j++){
            var result = _genAbnormalHougekiDamage(
                origin,
                target,
                targetIdx,
                targetHp[targetIdx],
                atack.damage[j],
                atack.type,
                formationMatch,
                formations[isFriend ? 0 : 1],
                toCombinedKind(friendCombinedType,isFriend ? originIdx : targetIdx),
                toCombinedKind(enemyCombinedType,!isFriend ? originIdx : targetIdx),
                isFriend,
                maxOriginHp,
                nowOriginHp,
                atack.critical != null ? atack.critical[j] : 0,
                date,
                battle);
            if(_isAbnormalDamage == null || (result != null && (Number(result.match(/\d+$/g) > Number(_isAbnormalDamage.match(/\d+$/g)))))){
                _isAbnormalDamage = result;
            }
            // ダメージ処理
            targetHp[targetIdx] -= atack.damage[j];
        }
        if(targetHp[targetIdx] <= 0){
            var item2 = new LinkedList(target.item2);
            if(target instanceof ShipDto) item2.add(target.slotExItem);
            // print("ダメコン発動！:" + target.fullName)
            // print(target.bull,target.shipInfo.json.api_bull_max);
            for(var k = 0;k < item2.size();k++){
                var item = item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        targetHp[targetIdx] = Math.floor(maxFriendHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        targetHp[targetIdx] = maxFriendHp[targetIdx];
                        // 攻撃側が自軍側でなければ、弾薬も回復
                        if(!isFriend) target.bull = target.bullMax;
                        break;
                    }
                }
            }
            // print(target.bull,target.shipInfo.json.api_bull_max);
        }
    }
    return _isAbnormalDamage;
}

function genAbnormalYasenDamage(atacks,friends,enemy,maxFriendHp,maxEnemyHp,friendHp,enemyHp,formationMatch,formations,friendCombinedType,enemyCombinedType,touchPlane,json,battle){
    var _genAbnormalYasenDamage = function(origin,target,targetIdx,targetHp,damage,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical,isTouch,spAttack,date){
        var stype = target.getStype();
        var oItem2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) oItem2.add(origin.slotExItem);
        var tItem2 = new LinkedList(target.item2);
        if(target instanceof ShipDto) tItem2.add(target.slotExItem);
        // 対潜攻撃
        if(stype == 13 || stype == 14) return genAbnormalTaisenDamage(origin,target,targetIdx,targetHp,damage,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical,false,true,battle);
        if((isFriend ? getData("MODE").ENEMY_ATTACK_ONLY : getData("MODE").FRIENDS_ATTACK_ONLY) || 
            (!getData("MODE").LAND && target.param.soku == 0) || 
            (!getData("MODE").PT && isPt(target)) || 
            (!getData("MODE").CRITICAL && isCritical(critical)) || 
            (getData("MODE").TAISEN_ONLY) ||
            (getData("MODE").SHIP_TYPE_FILTER != null && !getData("MODE").SHIP_TYPE_FILTER.some(function(x){ return x == origin.stype; })) ||
            (getData("MODE").ITEM_ID_FILTER != null && !getData("MODE").ITEM_ID_FILTER.some(function(x){ return oItem2.stream().anyMatch(function(i){ return i != null && i.slotitemId == x }); })) ||
            (getData("MODE").SHIP_LV_FILTER != null && !(getData("MODE").SHIP_LV_FILTER <= origin.lv))) return null;
        // 砲撃
        // print("夜戦",origin.fullName,target.fullName,targetHp+"-"+damage+"=>"+(targetHp-damage));
        var yasenPower = getYasenPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,isTouch,spAttack,date);
        // [[[キャップ後火力*集積地棲姫特効]*北端上陸姫乗算特効+北端上陸姫加算特効]*クリティカル補正]*PT小鬼群特効
        var finalYasenPower = Math.floor(Math.floor(Math.floor(yasenPower * getShusekiBonus(origin,target)) * getHokutanMultiplyBonus(origin,target) + getHokutanAddBonus(origin,target)) * getCriticalBonus(critical)) * getPtBonus(origin,target);
        var minDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 0.7;
        var maxDefensePower = (target.soukou + getBulgeBonus(target.item2)) * 1.3 - 0.6;
        var minDmg = Math.floor((finalYasenPower - maxDefensePower) * getAmmoBonus(origin,isFriend));
        var maxDmg = Math.floor((finalYasenPower - minDefensePower) * getAmmoBonus(origin,isFriend));
        var minPropDmg = Math.floor(targetHp * 0.06);
        var maxPropDmg = Math.floor(targetHp * 0.14 - 0.08);
        var minSunkDmg = Math.floor(targetHp * 0.5);
        var maxSunkDmg = Math.floor(targetHp * 0.8 - 0.3);
        var isHp1Obj = (targetHp - damage == 1) && isHp1ReplacementObj(target,targetIdx);
        
        var _isAbnormalDamage = isAbnormalDamage(damage,minDmg,maxDmg,minPropDmg,maxPropDmg,targetHp,minSunkDmg,maxSunkDmg,isFriend,isHp1Obj);
        if((_isAbnormalDamage || getData("MODE").FULL_LOG) && getData("MODE").LOG){
            var writeData = "";
            writeData += "日付:" + dateFormat.format(battle.getBattleDate()) + crlf;
            writeData += "戦闘場所:" + (battle.isPractice() ? "演習" : (battle.getMapCellDto().getMap()[0] + "-" + battle.getMapCellDto().getMap()[1] + "-" + battle.getMapCellDto().getMap()[2])) + crlf;
            writeData += "艦隊:味方->" + toFriendCombinedKindString(friendCombinedKind) + " 敵->" + toEnemyCombinedKindString(enemyCombinedKind) + crlf;
            writeData += "夜戦:" + origin.fullName + "[火力(装備含):" + origin.karyoku + ",雷装(装備含):" + origin.raisou + ",改修火力:" + getYasenKaishuPower(oItem2,date).toFixed(1) + "] -> " + target.fullName + "[装甲(装備含):" + target.soukou + ",バルジ改修ボーナス:" + getBulgeBonus(target.item2) + ",HP:" + targetHp + "-" + damage + "=>" + (targetHp-damage) + "]" + ((maxDmg >= damage && damage >= minDmg) ? "(想定内Dmg.)" : "(想定:" + (damage > maxDmg ? "+" + (damage - maxDmg) : "-" + (minDmg - damage)) + ")") + crlf;
            writeData += "攻撃->" + ('0000' + origin.getShipId()).slice(-4) + ":" + origin.fullName + crlf;
            writeData += toSlotString(origin);
            writeData += "防御->" + ('0000' + target.getShipId()).slice(-4) + ":" + target.fullName + crlf;
            writeData += toSlotString(target);
            writeData += "耐久:" + nowOriginHp + " / " + maxOriginHp + " (" + toHPStateString(maxOriginHp,nowOriginHp) + ",x" + getHPPowerBonus(maxOriginHp,nowOriginHp,false).toFixed(1) + ") 弾薬:" + (isFriend ? (origin.bull + " / " + origin.bullMax + " (" + (origin.bull / origin.bullMax * 100).toFixed() + "%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") : "? / ? (100%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") + crlf;
            writeData += "陸上特効:x" + getLandBonus(origin,target).toFixed(1) + " WG42加算特効:+" + getWGBonus(origin,target) + " 軽巡軽量砲補正:+" + getCLLightGunPowerBonus(origin,date).toFixed(1) + " Zara砲フィット補正:+" + getZaraGunFitPowerBonus(origin).toFixed(1) + crlf;
            writeData += "集積地特効:x" + getShusekiBonus(origin,target).toFixed(1) + " PT小鬼補正:x" + getPtBonus(origin,target).toFixed(1) + " 夜偵:" + (isTouch ? "発動(+5)" : "なし(+0)") + crlf;
            writeData += "北端上陸姫乗算特効:x" + getHokutanMultiplyBonus(origin,target).toFixed(2) + " 北端上陸姫加算特効:+" + getHokutanAddBonus(origin,target) + crlf;
            writeData += "夜戦攻撃種別:" + toSpAttackKindString(origin,spAttack) + crlf;
            writeData += "クリティカル:" + (isCritical(critical) ? "あり(x1.5)" : "なし(x1.0)") + crlf;
            writeData += "夜戦火力:" + yasenPower.toFixed(1) + " 最終夜戦火力:" + finalYasenPower.toFixed(1) + crlf;
            writeData += "防御力範囲:" + minDefensePower.toFixed(1) + " - " + maxDefensePower.toFixed(1) + crlf;
            writeData += "想定通常dmg:" + minDmg + " - " + maxDmg + crlf;
            writeData += "想定割合dmg:" + minPropDmg + " - " + maxPropDmg + crlf;
            writeData += "想定轟スdmg:" + minSunkDmg + " - " + maxSunkDmg + crlf;
            write(writeData);
        }
        if(_isAbnormalDamage){
            return origin.fullName + "→" + target.fullName + " dmg:" + damage + " 想定:" + (minDmg - damage > 0 ? ("-" + (minDmg - damage)) : ("+" + (damage - maxDmg)));
        }
        return null;
    };
    // print(json.api_hougeki.api_at_list)
    // print(json.api_hougeki.api_sp_list)
    var _isAbnormalDamage = null;
    for(var i = 0;i < atacks.size();i++){
        var atack = atacks.get(i);
        // api_active_deck[1,1]
        var isFriend = atack.friendAtack;
        var origin;
        var originIdx = atack.origin[0];
        var maxOriginHp;
        var nowOriginHp;
        var target;
        var targetHp;
        var targetIdx = atack.target[0];
        var isTouch;
        var spAttack = function(idx){
            for(var j = 0;j < json.api_hougeki.api_at_list.length;j++){
                if(json.api_hougeki.api_at_list[j] == (idx % 6) + (isFriend ? 0 : 6) + 1){
                    return json.api_hougeki.api_sp_list[j];
                }
            }
            return 0;
        }(originIdx);
        if(atack.friendAtack){
            origin = friends.get(originIdx);
            maxOriginHp = maxFriendHp[originIdx];
            nowOriginHp = friendHp[originIdx];
            target = enemy.get(targetIdx);
            targetHp = enemyHp;
            isTouch = touchPlane[0] != -1;
        }
        else {
            origin = enemy.get(originIdx);
            maxOriginHp = maxEnemyHp[originIdx];
            nowOriginHp = enemyHp[originIdx];
            target = friends.get(targetIdx);
            targetHp = friendHp;
            isTouch = touchPlane[1] != -1;
        }
        // print(origin.fullName,target.fullName,atack.target.length," spAttack:",spAttack)
        for(var j = 0;j < atack.damage.length;j++){
            var result = _genAbnormalYasenDamage(
                origin,
                target,
                targetIdx,
                targetHp[targetIdx],
                atack.damage[j],
                formationMatch,
                formations[isFriend ? 0 : 1],
                toCombinedKind(friendCombinedType,isFriend ? originIdx : targetIdx),
                toCombinedKind(enemyCombinedType,!isFriend ? originIdx : targetIdx),
                isFriend,
                maxOriginHp,
                nowOriginHp,
                atack.critical != null ? atack.critical[j] : 0,
                isTouch,
                spAttack,
                battle.getBattleDate(),
                battle);
            if(_isAbnormalDamage == null || (result != null && (Number(result.match(/\d+$/g) > Number(_isAbnormalDamage.match(/\d+$/g)))))){
                _isAbnormalDamage = result;
            }
            // ダメージ処理
            targetHp[targetIdx] -= atack.damage[j];
        }
        if(targetHp[targetIdx] <= 0){
            var item2 = new LinkedList(target.item2);
            if(target instanceof ShipDto) item2.add(target.slotExItem);
            // print("ダメコン発動！:" + target.fullName)
            for(var k = 0;k < item2.size();k++){
                var item = item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        targetHp[targetIdx] = Math.floor(maxFriendHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        targetHp[targetIdx] = maxFriendHp[targetIdx];
                        // 攻撃側が自軍側でなければ、弾薬も回復
                        if(!isFriend) target.bull = target.bullMax;
                        break;
                    }
                }
            }
        }
    }
    return _isAbnormalDamage;
}

function genAbnormalTaisenDamage(origin,target,targetIdx,targetHp,damage,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,critical,isOpeningTaisen,isYasen,battle){
    var stype = target.getStype();
    var oItem2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) oItem2.add(origin.slotExItem);
    var tItem2 = new LinkedList(target.item2);
    if(target instanceof ShipDto) tItem2.add(target.slotExItem);
    // 対潜攻撃
    if((stype != 13  && stype != 14) ||
        (!getData("MODE").TAISEN) ||
        (!isFriend) ||
        (getTaisenKind(origin,isYasen) == 7 && getSkilledBonus(origin,critical,false,true) > 1 && !getData("MODE").SKILLED && !isOpeningTaisen) ||
        (isFriend ? getData("MODE").ENEMY_ATTACK_ONLY : getData("MODE").FRIENDS_ATTACK_ONLY) ||
        (!getData("MODE").CRITICAL && isCritical(critical)) ||
        (!getData("MODE").FORMATION_MATCH.some(function(e){ return e == formationMatch; })) ||
        (getData("MODE").SHIP_TYPE_FILTER != null && !getData("MODE").SHIP_TYPE_FILTER.some(function(x){ return x == origin.stype; })) ||
        (getData("MODE").ITEM_ID_FILTER != null && !getData("MODE").ITEM_ID_FILTER.some(function(x){ return oItem2.stream().anyMatch(function(i){ return i != null && i.slotitemId == x }); })) ||
        (getData("MODE").SHIP_LV_FILTER != null && !(getData("MODE").SHIP_LV_FILTER <= origin.lv))) return null;
    // 対潜
    var taisenPower = getTaisenPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,isYasen,battle.getBattleDate());
    // 仮置き_(:3」∠)_
    var minFinalTaisenPower = Math.floor(Math.floor(taisenPower) * getCriticalBonus(critical) * (isOpeningTaisen ? 1.0 : getSkilledBonus(origin,critical,true,true)));
    var maxFinalTaisenPower = Math.floor(Math.floor(taisenPower) * getCriticalBonus(critical) * (isOpeningTaisen ? 1.0 : getSkilledBonus(origin,critical,false,true)));
    var minDefensePower = (target.soukou + getBulgeBonus(target.item2) - getBakuraiBonus(oItem2)) * 0.7;
    var maxDefensePower = (target.soukou + getBulgeBonus(target.item2) - getBakuraiBonus(oItem2)) * 1.3 - 0.6;
    var minDmg = Math.floor((minFinalTaisenPower - maxDefensePower) * getAmmoBonus(origin,isFriend));
    var maxDmg = Math.floor((maxFinalTaisenPower - minDefensePower) * getAmmoBonus(origin,isFriend));
    var minPropDmg = Math.floor(targetHp * 0.06);
    var maxPropDmg = Math.floor(targetHp * 0.14 - 0.08);
    var minSunkDmg = Math.floor(targetHp * 0.5);
    var maxSunkDmg = Math.floor(targetHp * 0.8 - 0.3);
    var isHp1Obj = (targetHp - damage == 1) && isHp1ReplacementObj(target,targetIdx);

    var _isAbnormalDamage = isAbnormalDamage(damage,minDmg,maxDmg,minPropDmg,maxPropDmg,targetHp,minSunkDmg,maxSunkDmg,isFriend,isHp1Obj);
    if((_isAbnormalDamage || getData("MODE").FULL_LOG) && getData("MODE").LOG){
        var writeData = "";
        writeData += "日付:" + dateFormat.format(battle.getBattleDate()) + crlf;
        writeData += "戦闘場所:" + (battle.isPractice() ? "演習" : (battle.getMapCellDto().getMap()[0] + "-" + battle.getMapCellDto().getMap()[1] + "-" + battle.getMapCellDto().getMap()[2])) + crlf;
        writeData += "艦隊:味方->" + toFriendCombinedKindString(friendCombinedKind) + " 敵->" + toEnemyCombinedKindString(enemyCombinedKind) + crlf;
        writeData += "交戦形態:" + toFormationMatchString(formationMatch) + " 攻撃側陣形:" + toFormationString(formation,false,true) + crlf;
        writeData += "対潜:" + origin.fullName + "[対潜(装備含):" + origin.taisen + ",改修火力:" + getTaisenKaishuPower(oItem2).toFixed(1) + ",空母用->対潜:" + origin.slotParam.taisen + ",爆雷減算ボーナス:" + getBakuraiBonus(oItem2).toFixed(1) + "] -> " + target.fullName + "[装甲(装備含):" + target.soukou + ",バルジ改修ボーナス:" + getBulgeBonus(target.item2) + ",HP:" + targetHp + "-" + damage + "=>" + (targetHp-damage) + "]" + ((maxDmg >= damage && damage >= minDmg) ? "(想定内Dmg.)" : "(想定:" + (damage > maxDmg ? "+" + (damage - maxDmg) : "-" + (minDmg - damage)) + ")") + crlf;
        writeData += "攻撃->" + ('0000' + origin.getShipId()).slice(-4) + ":" + origin.fullName + crlf;
        writeData += toSlotString(origin);
        writeData += "防御->" + ('0000' + target.getShipId()).slice(-4) + ":" + target.fullName + crlf;
        writeData += toSlotString(target);
        writeData += "耐久:" + nowOriginHp + " / " + maxOriginHp + " (" + toHPStateString(maxOriginHp,nowOriginHp) + ",x" + getHPPowerBonus(maxOriginHp,nowOriginHp,false).toFixed(1) + ") 弾薬:" + (isFriend ? (origin.bull + " / " + origin.bullMax + " (" + (origin.bull / origin.bullMax * 100).toFixed() + "%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") : "? / ? (100%,x" + getAmmoBonus(origin,isFriend).toFixed(1) + ")") + crlf;
        writeData += "対潜攻撃種別:" + (getTaisenKind(origin,isYasen) == 7 ? "航空攻撃(8)" : "爆雷攻撃(13)") + crlf;
        writeData += "[ソナー/爆雷投射機]シナジー:" + (hasTaisenSynergy(oItem2) ? "発動(x1.15)" : "なし(x1.0)") + crlf;
        writeData += "[ソナー/爆雷]シナジー:" + (hasNewTaisenSynergy(oItem2) ? "発動(+(x0.15))" : "なし(+(x0.0))") + crlf;
        writeData += "[爆雷投射機/爆雷]シナジー:" + (hasBakuraiSynergy(oItem2) ? "発動(+(x0.1))" : "なし(+(x0.0))") + crlf;
        writeData += "九五式爆雷の数:" + get95BakuraiNum(oItem2) + " 二式爆雷の数:" + get2BakuraiNum(oItem2) + " 大型ソナー:" + (hasLargeSonar(oItem2) ? "所持" : "不所持") + crlf;
        writeData += "クリティカル:" + (isCritical(critical) ? "あり(x1.5)" : "なし(x1.0)") + crlf;
        writeData += "熟練度倍率:" + (isOpeningTaisen ? "先制対潜(x1.0)" : ("x" + getSkilledBonus(origin,2,true,true).toFixed(3) + " - x" + getSkilledBonus(origin,2,false,true).toFixed(3))) + crlf;
        writeData += "対潜火力:" + taisenPower.toFixed(1) + " 対潜火力:" + minFinalTaisenPower.toFixed(1) + " - " + maxFinalTaisenPower.toFixed(1) + crlf;
        writeData += "防御力範囲:" + minDefensePower.toFixed(1) + " - " + maxDefensePower.toFixed(1) + crlf;
        writeData += "想定通常dmg:" + minDmg + " - " + maxDmg + crlf;
        writeData += "想定割合dmg:" + minPropDmg + " - " + maxPropDmg + crlf;
        writeData += "想定轟スdmg:" + minSunkDmg + " - " + maxSunkDmg + crlf;
        write(writeData);
    }
    if(_isAbnormalDamage){
        return origin.fullName + "→" + target.fullName + " dmg:" + damage + " 想定:" + (minDmg - damage > 0 ? ("-" + (minDmg - damage)) : ("+" + (damage - maxDmg)));
    }
    return null;
}

/**
 * キャップ後砲撃戦火力を返します。
 * 
 * キャップ前攻撃力 = ((基本攻撃力*a12+b12)*陸上特効*a13+WG42加算特効+b13)*交戦形態補正*攻撃側陣形補正*夜戦特殊攻撃補正*損傷状態補正*対潜シナジー補正*a14+軽巡軽量砲補正+b14
 * キャップ後攻撃力 = min(キャップ値,キャップ値+√(キャップ前攻撃力-キャップ値))
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @param {logbook.dto.EnemyShipDto} target 敵艦のデータ
 * @param {Number} formationMatch 交戦形態
 * @param {Number} formation 攻撃側陣形補正
 * @param {Number} friendCombinedKind 自軍連合艦隊の種別(0なら通常艦隊)
 * @param {Number} enemyCombinedKind 敵軍連合艦隊の種別(0なら通常艦隊)
 * @param {Boolean} isFriend 攻撃が味方側か
 * @return {Number} 砲撃戦火力
 */
function getHougekiPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,date){
    // 基本攻撃力
    var basicPower;
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    switch(getHougekiKind(origin)){
        case 7:
            var rai = target.param.soku > 0 ? origin.slotParam.raig : 0;
            var baku = target.param.soku > 0 ? origin.slotParam.baku : 0;
            // 空母系:[(火力+雷装+[1.3*爆装]+装備改修補正+連合艦隊補正)*1.5]+55
            basicPower = Math.floor((origin.karyoku + rai + Math.floor(baku * 1.3) + getHougekiKaishuPower(item2,date) + getCombinedHougekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend)) * 1.5) + 55;
            break;
        default:
            // それ以外:火力+装備改修補正+連合艦隊補正+5
            basicPower = (origin.karyoku + getHougekiKaishuPower(item2,date) + getCombinedHougekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend) + 5);
            break;
    }
    // キャップ前攻撃力 = (基本攻撃力*陸上特効+WG42加算特効)*交戦形態補正*攻撃側陣形補正*損傷状態補正+軽巡軽量砲補正
    var power = (basicPower * getLandBonus(origin,target) + getWGBonus(origin,target)) * getFormationMatchBonus(formationMatch) * getFormationBonus(formation) * getHPPowerBonus(maxOriginHp,nowOriginHp,false) + getCLLightGunPowerBonus(origin,date) + getZaraGunFitPowerBonus(origin);
    var cap = CHANGE_CAP_DATE.before(date) ? 180 : 150;
    // キャップ後攻撃力 = min(キャップ値,キャップ値+√(キャップ前攻撃力-キャップ値))
    return softcap(power,cap);
}

/**
 * 夜戦火力を返します。
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @return {Number} 夜戦火力
 */
function getYasenPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,isTouch,spAttack,date){
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var basicPower = (origin.karyoku + (target.param.soku > 0 || [1725,1726,1727].some(function(id){ return id == target.getShipId(); }) ? origin.raisou : 0)) + getYasenKaishuPower(item2,date) + (isTouch ? 5 : 0);
    var yasenPower = (basicPower * getLandBonus(origin,target) + getWGBonus(origin,target)) * getYasenCutinBonus(origin,spAttack) * getHPPowerBonus(maxOriginHp,nowOriginHp,false) + getCLLightGunPowerBonus(origin,date) + getZaraGunFitPowerBonus(origin);
    return softcap(yasenPower,300);
}

/**
 * 
 * @param {*} origin 
 * @param {*} target 
 * @param {*} formationMatch 
 * @param {*} formation 
 * @param {*} friendCombinedKind 
 * @param {*} enemyCombinedKind 
 * @param {*} isFriend 
 * @param {*} maxOriginHp 
 * @param {*} nowOriginHp 
 */
function getRaigekiPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp){
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var basicPower = origin.raisou + getRaigekiKaishuPower(item2) + getCombinedRaigekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend) + 5;
    var raigekiPower = basicPower * getFormationMatchBonus(formationMatch) * getFormationBonus(formation,true) * getHPPowerBonus(maxOriginHp,nowOriginHp,true);
    return softcap(raigekiPower,150);
}

function getTaisenPower(origin,target,formationMatch,formation,friendCombinedKind,enemyCombinedKind,isFriend,maxOriginHp,nowOriginHp,isYasen,date){
    // 基本攻撃力
    var taisenShip = origin.taisen - origin.slotParam.taisen;
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var taisenItem = item2.stream().filter(function(item){
        return item != null;
    }).filter(function(item){
        switch(item.type2){
            case  7: // 艦上爆撃機
            case  8: // 艦上攻撃機
            case 11: // 水上爆撃機
            case 14: // ソナー
            case 15: // 爆雷
            case 25: // オートジャイロ
            case 26: // 対潜哨戒機
            case 40: // 大型ソナー
            //case 41: // 大型飛行艇
                return true;
            default:
                return false;
        }
    }).mapToInt(function(item){
        return item.param.taisen;
    }).sum();
    var basicPower = 2 * Math.sqrt(taisenShip) + 1.5 * taisenItem + getTaisenKaishuPower(item2) + (getTaisenKind(origin,isYasen) == 7 ? 8 : 13);
    // キャップ前攻撃力 = 基本攻撃力*交戦形態補正*攻撃側陣形補正*損傷状態補正*従来対潜シナジー*新爆雷シナジー
    var power = basicPower * getFormationMatchBonus(formationMatch) * getFormationBonus(formation,false,true) * getHPPowerBonus(maxOriginHp,nowOriginHp,false) * (hasTaisenSynergy(item2) ? 1.15 : 1.0) * (1 + (hasNewTaisenSynergy(item2) ? 0.15 : 0) + (hasBakuraiSynergy(item2) ? 0.1 : 0));
    // キャップ後攻撃力 = min(キャップ値,キャップ値+√(キャップ前攻撃力-キャップ値))
    return softcap(power,100);
}

/**
 * (従来)対潜シナジー
 * ソナー + 爆雷"投射機" ← こ↑こ↓重要
 * 1.15倍補正
 */
function hasTaisenSynergy(item2){
    // 爆雷投射機=17,ソナー=18 両方必要なので、処理を変えないこと
    return item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return !isBakurai(item) && item.type3 === 17; })
        && item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type3 === 18; });
}

/**
 * (新)対潜シナジー
 * ソナー + 爆雷 ← TDN爆雷なことに注意
 * 1.15倍補正
 */
function hasNewTaisenSynergy(item2){
    // 対潜シナジーと新爆雷シナジーが発動かつ大型ソナー所持時は新対潜シナジーは発動しない
    // 普通のソナーはかかる模様
    if(hasTaisenSynergy(item2) && hasBakuraiSynergy(item2) && hasLargeSonar(item2)) return false;
    // 爆雷,ソナー=18 両方必要なので、処理を変えないこと
    return item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return isBakurai(item); })
        && item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type3 === 18; });
}

/**
 * 大型ソナーを所持しているか
 */
function hasLargeSonar(item2){
    return item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type2 == 40 });
}

/**
 * 新爆雷シナジー
 * 爆雷"投射機" + 爆雷
 * 1.1倍補正
 */
function hasBakuraiSynergy(item2){
    var bakuraiNum = get95BakuraiNum(item2) + get2BakuraiNum(item2);
    var hasBakurai = bakuraiNum > 0;
    return (item2.stream().filter(function(item){ return item != null && item.type3 === 17; }).count() - bakuraiNum > 0) && hasBakurai;
}

/**
 * 九五式爆雷の数
 */
function get95BakuraiNum(item2){
    return item2.stream().filter(function(item){ return item != null; }).map(function(item){ return item.slotitemId; }).filter(function(id){ return id === 226; }).count();
}

/**
 * 二式爆雷の数
 */
function get2BakuraiNum(item2){
    return item2.stream().filter(function(item){ return item != null; }).map(function(item){ return item.slotitemId; }).filter(function(id){ return id === 227; }).count();
}

/**
 * 爆雷かどうか
 * ※爆雷投射機ではないことに注意
 */
function isBakurai(item){
    return item.slotitemId === 226 || item.slotitemId === 227;
}

/**
 * 砲撃戦改修補正火力を返します。
 * 
 * @param {logbook.dto.ItemDto} item2 装備データ
 * @return {Number} 改修補正火力
 */
function getHougekiKaishuPower(item2,date){
    var kaishuBonus = function(type2){
        switch(type2){
            case 1: return 1;    // 小口径主砲
            case 2: return 1;    // 中口径主砲
            case 3: return 1.5;  // 大口径主砲
            case 38:return 1.5;  // 大口径主砲(II)
            case 4: return 1;    // 副砲
            case 19:return 1;    // 対艦強化弾
            case 36:return 1;    // 高射装置
            case 29:return 1;    // 探照灯
            case 42:return 1;    // 大型探照灯
            case 21:return 1;    // 機銃
            case 15:return 0.75; // 爆雷
            case 14:return 0.75; // ソナー
            case 40:return 0.75; // 大型ソナー
            case 24:return 1;    // 上陸用舟艇
            case 46:return 1;    // 特二式内火艇
            default:return 0;
        }
    };
    return item2.stream().filter(function(item){
        return item != null;
    }).mapToDouble(function(item){
        if(item.type2 == 4 && CHANGE_SUB_GUN_BONUS_DATE.before(date) && RETURN_TO_ORIGINAL_SUB_GUN_BONUS_DATE.after(date)){
            switch(item.type3){
                case  4: return 0.3 * item.level; // 副砲
                case 16: return 0.2 * item.level; // 高角副砲
            }
        }
        switch(item.slotitemId){
            case 10:  // 12.7cm連装高角砲
            case 66:  // 8cm高角砲
            case 220: // 8cm高角砲改＋増設機銃
                return 0.2 * item.level;
            // case 5:   // 15.5cm三連装砲
            case 12:  // 15.5cm三連装副砲
            case 234: // 15.5cm三連装副砲改
            // case 235: // 15.5cm三連装砲改
                return 0.3 * item.level;
        }
        return kaishuBonus(item.type2) * Math.sqrt(item.level);
    }).sum();
}

/**
 * 夜戦改修補正火力を返します。
 * 
 * @param {logbook.dto.ItemDto} item2 装備データ
 * @return {Number} 改修補正火力
 */
function getYasenKaishuPower(item2,date){
    var kaishuBonus = function(type2){
        switch(type2){
            case 1: return 1;    // 小口径主砲
            case 2: return 1;    // 中口径主砲
            case 3: return 1;    // 大口径主砲
            case 38:return 1.5;  // 大口径主砲(II)
            case 4: return 1;    // 副砲
            case 19:return 1;    // 対艦強化弾
            case 36:return 1;    // 高射装置
            case 29:return 1;    // 探照灯
            case 42:return 1;    // 大型探照灯
            case  5:return 1;    // 魚雷
            case 32:return 1;    // 潜水艦魚雷
            case 24:return 1;    // 上陸用舟艇
            case 46:return 1;    // 特二式内火艇
            default:return 0;
        }
    };
    return item2.stream().filter(function(item){
        return item != null;
    }).mapToDouble(function(item){
        if(item.type2 == 4 && CHANGE_SUB_GUN_BONUS_DATE.before(date) && RETURN_TO_ORIGINAL_SUB_GUN_BONUS_DATE.after(date)){
            switch(item.type3){
                case  4: return 0.3 * item.level; // 副砲
                case 16: return 0.2 * item.level; // 高角副砲
            }
        }
        switch(item.slotitemId){
            case 10:  // 12.7cm連装高角砲
            case 66:  // 8cm高角砲
            case 220: // 8cm高角砲改＋増設機銃
                return 0.2 * item.level;
            // case 5:   // 15.5cm三連装砲
            case 12:  // 15.5cm三連装副砲
            case 234: // 15.5cm三連装副砲改
            // case 235: // 15.5cm三連装砲改
                return 0.3 * item.level;
        }
        return kaishuBonus(item.type2) * Math.sqrt(item.level);
    }).sum();
}

/**
 * 雷撃戦改修補正火力を返します。
 * 
 * @param {logbook.dto.ItemDto} item2 装備データ
 * @return {Number} 改修補正火力
 */
function getRaigekiKaishuPower(item2){
    return item2.stream().filter(function(item){ return item != null && (item.type2 === 5 || item.type2 === 21 || item.type2 === 32); }).mapToDouble(function(item){ return 1.2 * Math.sqrt(item.level); }).sum();
}

/**
 * 対潜改修補正火力を返します。
 * 
 * @param {logbook.dto.ItemDto} item2 装備データ
 * @return {Number} 改修補正火力
 */
function getTaisenKaishuPower(item2){
    return item2.stream().filter(function(item){ return item != null && (item.type2 === 14 || item.type2 === 15 || item.type2 === 40); }).mapToDouble(function(item){ return  Math.sqrt(item.level); }).sum();
}

/**
 * ソフトキャップ
 * 
 * @param {Number} 火力
 * @param {Number} キャップ値
 * @return {Number} 補正後火力
 */
function softcap(power,cap){
    return (power > cap ? cap + Math.sqrt(power - cap) : power);
}

/**
 * 砲撃戦種別を返します。
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @return {Number} 種別
 */
function getHougekiKind(origin){
    // それ以外の処理
    // 速吸改or陸上型
    if(origin.getShipId() == 352 || origin.param.soku == 0){
        // 攻撃機が存在するか
        var item2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) item2.add(origin.slotExItem);
        var hasTorpedoBomber = item2.stream().filter(function(item){ return item != null; }).mapToInt(function(item){ return item.type2; }).anyMatch(function(type2){ return type2 == 7 || type2 == 8 || type2 == 47; });
        return hasTorpedoBomber ? 7 : 0; // 空撃or砲撃
    } else {
        switch(origin.stype){
            case 7:  // 軽空母
            case 11: // 正規空母
            case 18: // 装甲空母
                return 7; // 空撃
            default:
                return 0; // それ以外
        }
    }
}


/**
 * 対潜攻撃の種別を返します。
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @return {Number} 7なら空撃、8なら爆雷攻撃
 */
function getTaisenKind(ship,isYasen){
    switch (ship.stype) {
        case 7: // 軽空母
            return !isYasen ? 7 : 8;
        case 6: // 航空巡洋艦
        case 10: // 航空戦艦
        case 16: // 水上機母艦
        case 17: // 揚陸艦
            return 7;
        default:
            if(!isYasen){
                var taisenItem = ship.slotParam.taisen;
                var taisenShip = ship.taisen - taisenItem;
                // 速吸改
                if(ship.getShipId() == 352){
                    return ship.item2.stream().filter(function(item){
                        return item != null;
                    }).anyMatch(function(item){
                        switch(item.type2){
                            case 8:  // 艦上攻撃機
                                return item.param.taisen > 0;
                            case 11: // 水上爆撃機
                            case 25: // オートジャイロ
                                return true;
                        }
                        return false;
                    }) ? 7 : 8; // 空撃or爆雷攻撃
                }
            }
            return 8; // 爆雷攻撃
    }
}

/**
 * 弾着ダメージ倍率を返します。
 * 
 * @param {Number} kind 種別
 * @return {Number} 補正倍率
 */
function getDanchakuDamageMagnification(kind){
    switch(kind){
        case 2: return 1.2; // 連続
        case 3: return 1.1; // 主砲+副砲
        case 4: return 1.2; // 主砲+電探
        case 5: return 1.3; // 主砲+徹甲弾
        case 6: return 1.5; // 主砲+主砲
        default:return 1.0; // 1回攻撃
    }
}

/**
 * 夜戦CIダメージ倍率を返します。
 * 
 * @param {*} origin
 * @param {Number} kind 種別
 * @return {Number} 補正倍率
 */
function getYasenCutinBonus(origin,kind){
    switch(Number(kind)){
        case 1: return 1.2;   // 連撃
        case 2: return 1.3;   // 主魚CI
        case 3:
            var item2 = new LinkedList(origin.item2);
            if(origin instanceof ShipDto) item2.add(origin.slotExItem);
            var lateTorpedo = item2.stream().filter(function(item){ return item != null }).mapToInt(function(item){ return item.getSlotitemId(); }).filter(function(id){ return id == 213 || id == 214; }).count();
            var radiolocator = item2.stream().filter(function(item){ return item != null }).mapToInt(function(item){ return item.type1; }).filter(function(type1){ return type1 == 42; }).count();
            if(lateTorpedo >= 1 && radiolocator >= 1) return 1.75; // 後電CI
            if(lateTorpedo >= 2) return 1.6; // 後魚CI
            return 1.5;   // 魚雷CI
        case 4: return 1.75;  // 主主副CI
        case 5: return 2.0;   // 主砲CI
        default:return 1.0;   // 1回攻撃
    }
}

/**
 * 弾薬補正(キャップ後最終計算)
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @param {Boolean} isFriend
 * @return {Number} 補正火力
 */
function getAmmoBonus(ship,isFriend){
    if(isFriend && !isNewVersion() && ship.getShipId() > 500){
        return Math.min(Math.floor(ship.bull / Number(ship.shipInfo.json.api_bull_max) * 100) / 50,1);
    }
    return isFriend ? Math.min(Math.floor(ship.bull / ship.bullMax * 100) / 50,1) : 1.0;
}

/**
 * 耐久補正
 * 
 * @param {Number} max 
 * @param {Number} now 
 * @param {Boolean} isRaigeki
 * @return {Number} 
 */
function getHPPowerBonus(max,now,isRaigeki){
    var rate = now / max;
    // print("max:" + max + " now:" + now + " rate:" + rate)
    if(rate <= 0.25){
        return isRaigeki ? 0 : 0.4;
    } else if(rate <= 0.5){
        return isRaigeki ? 0.8 : 0.7;
    }
    return 1.0;
}

function toHPStateString(max,now){
    var rate = now / max;
    // print("max:" + max + " now:" + now + " rate:" + rate)
    if(rate <= 0.25){
        return "大破";
    } else if(rate <= 0.5){
        return "中破";
    } else if(rate <= 0.75){
        return "小破";
    }
    return "小破未満";
}

/**
 * 軽巡軽量砲補正を返します。
 * 
 * @param {logbook.dto.ShipDto} ship 艦娘のデータ
 * @return {Number} 補正火力
 */
function getCLLightGunPowerBonus(origin,date){
    if(ADD_CL_LIGHT_GUN_BONUS_DATE.after(date)) return 0;
    switch(origin.stype){
        case 3:  // 軽巡
        case 4:  // 雷巡
        case 21: // 練巡
            var item2 = new LinkedList(origin.item2);
            if(origin instanceof ShipDto) item2.add(origin.slotExItem);
            var single = item2.stream().filter(function(item){
                return item != null;
            }).filter(function(item){
                switch(item.slotitemId){
                    case 4:  // 14cm単装砲
                    case 11: // 15.2cm単装砲
                        return true;
                    default:
                        return false;
                }
            }).count();
            var twin = item2.stream().filter(function(item){
                return item != null;
            }).filter(function(item){
                switch(item.slotitemId){
                    case 65:  // 15.2cm連装砲
                    case 119: // 14cm連装砲
                    case 139: // 15.2cm連装砲改
                        return true;
                    default:
                        return false;
                }
            }).count();
            return Math.sqrt(twin) * 2 + Math.sqrt(single);
        default:
            return 0;
    } 
}

function getZaraGunFitPowerBonus(origin){
    switch(origin.getShipId()){
        case 448: // Zara
        case 358: // Zara改
        case 496: // Zara due
        case 449: // Pola
        case 361: // Pola改
            var item2 = new LinkedList(origin.item2);
            if(origin instanceof ShipDto) item2.add(origin.slotExItem);
            return Math.sqrt(item2.stream().filter(function(item){
                // 203mm／53 連装砲
                return item != null && item.slotitemId == 162;
            }).count());
        default:
            return 0;
    }
}

/**
 * 陸上特効倍率を返します。
 * 
 * @param {logbook.dto.ShipDto} origin
 * @param {logbook.dto.EnemyShipDto} target
 * @return {Number} description
 */
function getLandBonus(origin,target){
    // 速力有=水上艦 -> 除外
    if(target.param.soku > 0) return 1.0;

    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var type3shell = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 35; }).count();
    var daihatsu = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 68; }).count();
    var daihatsuLv = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 68; }).mapToInt(function(item){ return item.getLevel(); }).average().orElse(0);
    var rikuDaihatsu = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 166; }).count();
    var rikuDaihatsuLv = item2.stream().filter(function(item){ return item != null && (item.getSlotitemId() == 68 || item.getSlotitemId() == 166); }).mapToInt(function(item){ return item.getLevel(); }).average().orElse(0);
    var kamisha = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 167; }).count();
    var kamishaLv = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 167; }).mapToInt(function(item){ return item.getLevel(); }).average().orElse(0);
    var suijo = item2.stream().filter(function(item){ return item != null && (item.type2 == 11 || item.type2 == 45); }).count();
    var apShell = item2.stream().filter(function(item){ return item != null && item.type1 == 25; }).count();
    var wg42 = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 126; }).count();
    var tokuRikuDaihatsu = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 230; }).count();

    switch(target.getShipId()){
        case 1668:
        case 1669:
        case 1670:
        case 1671: 
        case 1672: // 離島棲姫
            var type3shellBonus = (type3shell >= 1) ? 1.75 : 1.0;
            var wg42Bonus = (wg42 >= 2) ? 2.1 : (wg42 == 1 ? 1.4 : 1.0);
            return type3shellBonus * wg42Bonus;
        case 1665:
        case 1666: 
        case 1667: // 砲台小鬼
            var stype = origin.getStype();
            // 駆逐・軽巡のみ
            var stypeBonus = (stype == 2 || stype == 3) ? 1.4 : 1.0;
            var daihatsuBonus = (daihatsu >= 1 ? 1.8 : 1.0) * (1 + daihatsuLv / 50);
            var rikuDaihatsuBonus = function(num){
                if(num >= 2) return 3.0;
                if(num == 1) return 2.15;
                return 1.0;
            }(rikuDaihatsu) * (1 + rikuDaihatsuLv / 50);
            var kamishaBonus = function(num){
                if(num >= 2) return 3.2;
                if(num == 1) return 2.4;
                return 1.0;
            }(kamisha) * (1 + kamishaLv / 30);
            var suijoBonus = (suijo >= 1) ? 1.5 : 1.0;
            var apShellBonus = (apShell >= 1) ? 1.85 : 1.00;
            var wg42Bonus = (wg42 >= 2) ? 2.72 : (wg42 == 1 ? 1.60 : 1.00);
            return stypeBonus * (rikuDaihatsu > 0 ? rikuDaihatsuBonus : daihatsuBonus) * kamishaBonus * suijoBonus * apShellBonus * wg42Bonus;
        case 1725:
        case 1726:
        case 1727: // 北端上陸姫
            return 1.0;
        default:
            // ソフトキャップ
            var type3shellBonus = (type3shell >= 1) ? 2.5 : 1.0;
            return type3shellBonus;
    }
}

/**
 * WG42加算特効を返します。
 * 
 * @param {logbook.dto.ShipDto} ship 
 * @param {logbook.dto.EnemyShipDto} target 
 * @return {Number} description
 */
function getWGBonus(origin,target){
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var wgCount = item2.stream().filter(function(item){
        return item != null;
    }).filter(function(item){
        return item.getSlotitemId() == 126;
    }).count();
    if(target.param.soku > 0 || [1725,1726,1727].some(function(id){ return id == target.getShipId(); })) return 0;
    switch(wgCount){
        case 1: return 75;
        case 2: return 110;
        case 3: return 140;
        case 4: return 160;
        default:return 0;
    }
}

/**
 * 交戦形態補正倍率を返します。
 * 
 * @param {Number} formationMatch 交戦形態
 * @return {Number} description
 */
function getFormationMatchBonus(formationMatch){
    switch(formationMatch){
        case 1: return 1.0; // 同航戦
        case 2: return 0.8; // 反航戦
        case 3: return 1.2; // T字有利
        case 4: return 0.6; // T字不利
        default:return 1.0;
    }
}

/**
 * 攻撃側陣形補正を返します。
 * 
 * @param {Number} formationMatch 陣形補正
 * @param {boolean} isRaigeki 雷撃か
 * @param {boolean} isTaisen 対潜か
 * @return {Number} description
 */
function getFormationBonus(formation,isRaigeki,isTaisen){
    var _isRaigeki = typeof isRaigeki != 'undefined' ? isRaigeki : false; 
    var _isTaisen  = typeof isTaisen  != 'undefined' ? isTaisen  : false; 
    if(_isRaigeki){
        switch(formation){
            case 1: return 1.0; // 単縦陣
            case 2: return 0.8; // 複縦陣
            case 3: return 0.7; // 輪形陣
            case 4: return 0.6; // 梯形陣
            case 5: return 0.6; // 単横陣
            case 11:return 0.7; // 第一警戒航行序列
            case 12:return 0.9; // 第二警戒航行序列
            case 13:return 0.6; // 第三警戒航行序列
            case 14:return 1.0; // 第四警戒航行序列
            default:return 1.0;
        }
    } else if(_isTaisen){
        switch(formation){
            case 1: return 0.6; // 単縦陣
            case 2: return 0.8; // 複縦陣
            case 3: return 1.2; // 輪形陣
            case 4: return 1.0; // 梯形陣
            case 5: return 1.3; // 単横陣
            case 11:return 1.3; // 第一警戒航行序列
            case 12:return 1.1; // 第二警戒航行序列
            case 13:return 1.0; // 第三警戒航行序列
            case 14:return 0.7; // 第四警戒航行序列
            default:return 1.0;
        }
    } else {
        switch(formation){
            case 1: return 1.0; // 単縦陣
            case 2: return 0.8; // 複縦陣
            case 3: return 0.7; // 輪形陣
            case 4: return 0.6; // 梯形陣
            case 5: return 0.6; // 単横陣
            case 11:return 0.8; // 第一警戒航行序列
            case 12:return 1.0; // 第二警戒航行序列
            case 13:return 0.7; // 第三警戒航行序列
            case 14:return 1.1; // 第四警戒航行序列
            default:return 1.0;
        }
    }
}

/**
 * 連合艦隊砲撃補正を返します。
 * 
 * @param {Number} friendCombinedKind 味方連合艦隊の種類
 * @param {Number} enemyCombinedKind 敵連合艦隊の種類 
 * @param {Boolean} isFriend 味方が攻撃側か 
 * @return {Number}
 */
function getCombinedHougekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend){
    if(isFriend){
        if(enemyCombinedKind > 0){
            switch(friendCombinedKind){
                case 0:  // 味方:通常艦隊               -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return  5;
                case 11: // 味方:空母機動部隊(第一艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return  2;
                case 12: // 味方:空母機動部隊(第二艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return -5;
                case 21: // 味方:水上打撃部隊(第一艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return  2;
                case 22: // 味方:水上打撃部隊(第二艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return -5;
                case 31: // 味方:輸送護衛部隊(第一艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return -5;
                case 32: // 味方:輸送護衛部隊(第二艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                    return -5;
                default:
                    return 0;
            }
        } else {
            switch(friendCombinedKind){
                case 0:  // 味方:通常艦隊               -> 敵:通常艦隊
                    return  0;
                case 11: // 味方:空母機動部隊(第一艦隊) -> 敵:通常艦隊
                    return  2;
                case 12: // 味方:空母機動部隊(第二艦隊) -> 敵:通常艦隊
                    return 10;
                case 21: // 味方:水上打撃部隊(第一艦隊) -> 敵:通常艦隊
                    return 10;
                case 22: // 味方:水上打撃部隊(第二艦隊) -> 敵:通常艦隊
                    return -5;
                case 31: // 味方:輸送護衛部隊(第一艦隊) -> 敵:通常艦隊
                    return -5;
                case 32: // 味方:輸送護衛部隊(第二艦隊) -> 敵:通常艦隊
                    return 10;
                default:
                    return 0;
            }
        }
    } else {
        if(enemyCombinedKind > 0){
            if(enemyCombinedKind % 10 == 1){
                // 敵:空母機動部隊(第一艦隊) -> 味方:Any
                return 10;
            } else {
                // 敵:空母機動部隊(第二艦隊) -> 味方:Any
                return -5;
            }
        } else {
            switch(friendCombinedKind){
                case 0:  // 敵:通常艦隊 -> 味方:通常艦隊
                    return  0;
                case 11: // 敵:通常艦隊 -> 味方:空母機動部隊(第一艦隊)
                    return 10;
                case 12: // 敵:通常艦隊 -> 味方:空母機動部隊(第二艦隊)
                    return  5;
                case 21: // 敵:通常艦隊 -> 味方:水上打撃部隊(第一艦隊)
                    return  5;
                case 22: // 敵:通常艦隊 -> 味方:水上打撃部隊(第二艦隊)
                    return -5;
                case 31: // 敵:通常艦隊 -> 味方:輸送護衛部隊(第一艦隊)
                    return 10;
                case 32: // 敵:通常艦隊 -> 味方:輸送護衛部隊(第二艦隊)
                    return  5;
                default:
                    return 0;
            }
        }
    }
}

/**
 * 連合艦隊雷撃補正を返します。
 * 
 * @param {Number} friendCombinedKind 味方連合艦隊の種類
 * @param {Number} enemyCombinedKind 敵連合艦隊の種類 
 * @param {Boolean} isFriend 味方が攻撃側か 
 * @return {Number}
 */
function getCombinedRaigekiPoewrBonus(friendCombinedKind,enemyCombinedKind,isFriend){
    if(isFriend){
        if(enemyCombinedKind > 0){
            if(friendCombinedKind > 0){
                // 味方:連合艦隊(第二艦隊) -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                return 10;
            } else {
                // 味方:通常艦隊           -> 敵:空母機動部隊(第一艦隊/第二艦隊)
                return 10;
            }
        } else {
            if(friendCombinedKind > 0){
                // 味方:連合艦隊(第二艦隊) -> 敵:通常艦隊
                return -5;
            } else {
                // 味方:通常艦隊           -> 敵:通常艦隊
                return 0;
            }
        }
    } else {
        if(enemyCombinedKind > 0){
            // 敵:連合艦隊(第二艦隊) -> 味方:Any
            return 5;
        } else {
            if(friendCombinedKind > 0){
                // 敵:通常艦隊 -> 味方:連合艦隊(第一艦隊/第二艦隊)
                return -5;
            } else {
                // 敵:通常艦隊 -> 味方:通常艦隊
                return 0;
            }
        }
    }
}

/**
 * 
 * @param {String} s 
 * @return {Number} 
 */
function fromFormationMatch(s){
    switch(s){
        case "同航戦": return 1;
        case "反航戦": return 2;
        case "Ｔ字有利": return 3;
        case "Ｔ字不利": return 4;
        default: return 1;
    }
}

function toFormationMatchString(k){
    switch(k){
        case 1: return "同航戦(x1.0)";
        case 2: return "反航戦(x0.8)";
        case 3: return "Ｔ字有利(x1.2)";
        case 4: return "Ｔ字不利(x0.6)";
        default: return "不明(" + k + ")";
    }
}

function toFormationString(formation,isRaigeki,isTaisen){
    var _isRaigeki = isRaigeki !== undefined ? isRaigeki : false;
    var _isTaisen  = isTaisen  !== undefined ? isTaisen  : false;
    if(_isRaigeki){
        switch(formation){
            case 1: return "単縦陣(x1.0)";
            case 2: return "複縦陣(x0.8)";
            case 3: return "輪形陣(x0.7)";
            case 4: return "梯形陣(x0.6)";
            case 5: return "単横陣(x0.6)";
            case 11:return "第一警戒航行序列(x0.7)";
            case 12:return "第二警戒航行序列(x0.9)";
            case 13:return "第三警戒航行序列(x0.6)";
            case 14:return "第四警戒航行序列(x1.0)";
            default:return "不明";
        }
    } else if(_isTaisen){
        switch(formation){
            case 1: return "単縦陣(x0.6)";
            case 2: return "複縦陣(x0.8)";
            case 3: return "輪形陣(x1.2)";
            case 4: return "梯形陣(x1.0)";
            case 5: return "単横陣(x1.3)";
            case 11:return "第一警戒航行序列(x1.3)";
            case 12:return "第二警戒航行序列(x1.1)";
            case 13:return "第三警戒航行序列(x1.0)";
            case 14:return "第四警戒航行序列(x0.7)";
            default:return "不明";
        }
    } else {
        switch(formation){
            case 1: return "単縦陣(x1.0)";
            case 2: return "複縦陣(x0.8)";
            case 3: return "輪形陣(x0.7)";
            case 4: return "梯形陣(x0.6)";
            case 5: return "単横陣(x0.6)";
            case 11:return "第一警戒航行序列(x0.8)";
            case 12:return "第二警戒航行序列(x1.0)";
            case 13:return "第三警戒航行序列(x0.7)";
            case 14:return "第四警戒航行序列(x1.1)";
            default:return "不明";
        }
    }
}

/**
 * 
 * @param {String[]} a 
 * @return {Number[]}
 */
function fromFormations(a){
    return [BattleExDto.fromFormation(a[0]),BattleExDto.fromFormation(a[1])];
}

/**
 * 集積地特効
 * 
 * @param {logbook.dto.ShipDto} origin 
 * @param {logbook.dto.ShipDto} target 
 * @return {Number}
 */
function getShusekiBonus(origin,target){
    switch(target.getShipId()){
        case 1653:
        case 1654:
        case 1655:
        case 1656:
        case 1657:
        case 1658:
            var item2 = new LinkedList(origin.item2);
            if(origin instanceof ShipDto) item2.add(origin.slotExItem);
            var wg42 = item2.stream().filter(function(item){ return item != null && item.slotitemId == 126; }).count();
            var rikuDaihatsu = item2.stream().filter(function(item){ return item != null && item.slotitemId == 166; }).count();
            var rikuDaihatsuLv = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 166; }).mapToInt(function(item){ return item.getLevel(); }).average().orElse(0);
            var rikuDaihatsuLvBonus = 1 + rikuDaihatsuLv / 50;
            var kamisha = item2.stream().filter(function(item){ return item != null && item.slotitemId == 167; }).count();
            var kamishaLv = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 167; }).mapToInt(function(item){ return item.getLevel(); }).average().orElse(0);
            var kamishaLvBonus = 1 + kamishaLv / 30;
            var wg42Bonus = function(num){
                if(num == 1) return 1.25;
                if(num >= 2) return 1.625;
                return 1.0;
            }(wg42);
            var rikuDaihatsuBonus = function(num){
                if(num == 1) return 1.30;
                if(num >= 2) return 2.08;
                return 1.0;
            }(rikuDaihatsu);
            var kamishaBonus = function(num){
                if(num == 1) return 1.70;
                if(num >= 2) return 2.50;
                return 1.0;
            }(kamisha);
            return wg42Bonus * rikuDaihatsuBonus * rikuDaihatsuLvBonus * kamishaBonus * kamishaLvBonus;
        default:
            return 1.0;
    }
}

function getHokutanMultiplyBonus(origin,target){
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var type3shell = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 35; }).count();
    var wg42 = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 126; }).count();
    switch(target.getShipId()){
        case 1725:
        case 1726:
        case 1727: // 北端上陸姫
             var type3shellBonus = (type3shell >= 1) ? 1.3 : 1.0;
             var wg42Bonus = (wg42 >= 1) ? 1.4 : 1.0;
             return type3shellBonus * wg42Bonus;
        default:
            return 1.0;
    }
}

function getHokutanAddBonus(origin,target){
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var type3shell = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 35; }).count();
    var wg42 = item2.stream().filter(function(item){ return item != null && item.getSlotitemId() == 126; }).count();
    switch(target.getShipId()){
        case 1725:
        case 1726:
        case 1727: // 北端上陸姫
             var type3shellBonus = (type3shell >= 1) ? 1 : 0;
             var wg42Bonus = (wg42 >= 1) ? 15 : 0;
             return type3shellBonus + wg42Bonus;
        default:
            return 0;
    }
}

/**
 * 徹甲弾補正
 * 
 * @param {logbook.dto.ShipDto} origin 
 * @param {logbook.dto.ShipDto} target 
 * @return {Number}
 */
function getAPshellBonus(origin,target){
    if(isAPshellBonusTarget(target.stype)){
        var item2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) item2.add(origin.slotExItem);
        var mainGun = item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type1 == 1; });
        var subGun = item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type1 == 2; });
        var apShell = item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type1 == 25; });
        var radar = item2.stream().filter(function(item){ return item != null; }).anyMatch(function(item){ return item.type1 == 8; });
        if(mainGun && apShell){
            if(subGun) return 1.15;
            if(radar)  return 1.10;
            return 1.08;
        }
    }
    return 1.0;
}

function isAPshellBonusTarget(stype){
    switch(stype){
        case 5:  // 重巡洋艦
        case 6:  // 航空巡洋艦
        case 8:  // 巡洋戦艦
        case 9:  // 戦艦
        case 10: // 航空戦艦
        case 11: // 正規空母
        case 12: // 超弩級戦艦
        case 18: // 装甲空母
            return true;
        default:
            return false;
    }
}

/**
 * クリティカル補正
 * 
 * @param {Number} critical 
 * @return {Number}
 */
function getCriticalBonus(critical){
    return (critical == 2) ? 1.5 : 1.0;
}

/**
 * クリティカルか
 * 
 * @param {Number} critical 
 * @return {Boolean}
 */
function isCritical(critical){
    return critical == 2;
}

/**
 * 熟練度補正
 * 
 * @param {logbook.dto.ShipDto} ship 
 * @return {Number}
 */
function getSkilledBonus(origin,critical,isMin,isAir){
    var SKILLED = [
        { INTERNAL:[  0,  9], DEPENDENCE_BONUS:[ 0, 0] }, // なし [0.00-0.03]
        { INTERNAL:[ 10, 24], DEPENDENCE_BONUS:[ 1, 1] }, // |    [0.04-0.05]
        { INTERNAL:[ 25, 39], DEPENDENCE_BONUS:[ 2, 2] }, // ||   [0.07-0.08]
        { INTERNAL:[ 40, 54], DEPENDENCE_BONUS:[ 3, 3] }, // |||  [0.09-0.10]
        { INTERNAL:[ 55, 69], DEPENDENCE_BONUS:[ 4, 4] }, // \    [0.11-0.12]
        { INTERNAL:[ 70, 84], DEPENDENCE_BONUS:[ 5, 7] }, // \\   [0.13-0.16]
        { INTERNAL:[ 85, 99], DEPENDENCE_BONUS:[ 7, 7] }, // \\\  [0.16-0.16]
        { INTERNAL:[100,120], DEPENDENCE_BONUS:[10,10] }, // >>   [0.20-0.20]
    ]
    var isSkilledObject = function(type2){
        switch(type2){
            case 7:  // 艦上爆撃機
            case 8:  // 艦上攻撃機
            case 11: // 水上爆撃機
            case 41: // 大型飛行艇
            case 57: // 噴式戦闘爆撃機
            case 58: // 噴式攻撃機
                return true;
            default:
                return false;
        }
    };
    var result = 1.0;
    var item2 = new LinkedList(origin.item2);
    if(origin instanceof ShipDto) item2.add(origin.slotExItem);
    var isAirBattle = typeof isAir != 'undefined' ? isAir : false;
    if(((getHougekiKind(origin) == 7 || isAirBattle) && isCritical(critical)) && (origin instanceof ShipDto)){
        var slots = origin.getOnSlot();
        for(var i = 0;i < item2.size();i++){
            var item = item2.get(i);
            // 補強増設対策
            if(item != null && isSkilledObject(item.type2) && i < slots.length && slots[i] > 0){
                // print(i,item.name,item.getAlv())
                var alv = item.getAlv();
                if(i == 0){
                    result += Math.floor(Math.sqrt(SKILLED[alv].INTERNAL[(isMin ? 0 : 1)]) + SKILLED[alv].DEPENDENCE_BONUS[(isMin ? 0 : 1)]) / 100;
                } else {
                    result += Math.floor(Math.sqrt(SKILLED[alv].INTERNAL[(isMin ? 0 : 1)]) + SKILLED[alv].DEPENDENCE_BONUS[(isMin ? 0 : 1)]) / 200;
                }
            }
        }
    }
    return result;
}

/**
 * 弾着補正
 * 
 * @param {Number} kind 
 */
function getSpottingBonus(kind){
    switch(kind){
        case 0: return 1.0; // 通常攻撃
        case 1: return 1.0; // レーザー攻撃
        case 2: return 1.2; // 連撃
        case 3: return 1.1; // 主砲+副砲
        case 4: return 1.2; // 主砲+電探
        case 5: return 1.3; // 主砲+徹甲弾
        case 6: return 1.5; // 主砲+主砲
        default:return 1.0; // それ以外
    }
}

function toSpottingKindString(kind){
    switch(kind){
        case 0: return "通常攻撃(x1.0)";
        case 1: return "超重力砲(x?.?)";
        case 2: return "連撃(x1.2)";
        case 3: return "主砲+副砲(x1.1)";
        case 4: return "主砲+電探(x1.2)";
        case 5: return "主砲+徹甲弾(x1.3)";
        case 6: return "主砲+主砲(x1.5)";
        default:return "？？？";
    }
}

/**
 * PT特効
 * 
 * @param {logbook.dto.ShipDto} origin 
 * @param {logbook.dto.ShipDto} target 
 */
function getPtBonus(origin,target){
    if(isPt(target)){
        var item2 = new LinkedList(origin.item2);
        if(origin instanceof ShipDto) item2.add(origin.slotExItem);
        // 小口径主砲
        var sMainGun = item2.stream().filter(function(item){ return item != null && item.type2 == 1; }).count();
        // 機銃
        var aaGun = item2.stream().filter(function(item){ return item != null && item.type2 == 21; }).count();
        // 副砲
        var subGun = item2.stream().filter(function(item){ return item != null && item.type2 == 4; }).count();
        // 三式弾
        var type3Shell = item2.stream().filter(function(item){ return item != null && item.type2 == 18; }).count();
        var aaGunBonus = (aaGun >= 2) ? 1.1 : 1.0;
        var sMainGunBonus = function(ship,num){
            switch(ship.getShipId()){
                case 445: // 秋津洲
                case 450: // 秋津洲改
                case 352: // 速吸改
                case 460: // 速吸
                    return 1.0;
                default:
                    return (num >= 2) ? 1.2 : 1.0;
            }
        }(origin,sMainGun);
        var subGunBonus = function(ship,num){
            switch(ship.getStype()){
                case 3: // 軽巡洋艦
                case 4: // 重雷装巡洋艦
                    return 1.0;
                default:
                    return (num >= 2) ? 1.2 : 1.0;
            }
        }(origin,subGun);
        var type3ShellBonus = (type3Shell >= 1) ? 1.3 : 1.0;
        return aaGunBonus * sMainGunBonus * subGunBonus * type3ShellBonus;
    }
    return 1.0;
}

function genAirBattle(air,friendHp,enemyHp,maxFriendHp,maxEnemyHp,friends,enemy){
    // print("friendHp(air):" + friendHp)
    // print("enemyHp(air):" + enemyHp)
    if((air == null) || (air.atacks == null) || (air.atacks.size() == 0)) return;
    for(var i in air.atacks){
        var atack = air.atacks[i];
        var targetHp;
        if(atack.friendAtack){
            targetHp = enemyHp;
        } else {
            targetHp = friendHp;
        }
        for(var j in atack.damage){
            // print("targetHp[atack.target[" + j + "]]:" + targetHp[atack.target[j]] + " atack.damage[" + j + "]:" + atack.damage[j])
            targetHp[atack.target[j]] -= atack.damage[j];
        }
    }
    // フレンズ
    for(var targetIdx = 0;targetIdx < friendHp.length;targetIdx++){
        if(friendHp[targetIdx] <= 0){
            var target = friends.get(targetIdx);
            var item2 = new LinkedList(target.item2);
            if(target instanceof ShipDto) item2.add(target.slotExItem);
            // print("ダメコン発動！:" + target.fullName)
            for(var k = 0;k < item2.size();k++){
                var item = item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        friendHp[targetIdx] = Math.floor(maxFriendHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        friendHp[targetIdx] = maxFriendHp[targetIdx];
                        break;
                    }
                }
            }
        }
    }
    // セルリアン
    for(var targetIdx = 0;targetIdx < enemyHp.length;targetIdx++){
        if(enemyHp[targetIdx] <= 0){
            var target = enemy.get(targetIdx);
            var item2 = new LinkedList(target.item2);
            if(target instanceof ShipDto) item2.add(target.slotExItem);
            // print("ダメコン発動！:" + target.fullName)
            for(var k = 0;k < item2.size();k++){
                var item = item2.get(k);
                if(item != null){
                    var slotitemId = item.slotitemId;
                    if(slotitemId == 42){
                        // 応急修理要員
                        enemyHp[targetIdx] = Math.floor(maxEnemyHp[targetIdx] * 0.2);
                        break;
                    } else if(slotitemId == 43){
                        // 応急修理女神
                        enemyHp[targetIdx] = maxEnemyHp[targetIdx];
                        break;
                    }
                }
            }
        }
    }
}

function genSupportAttack(atacks,friendHp,enemyHp){
    // ダメージ処理
    atacks.forEach(function(atack){
        var targetHp;
        if(atack.friendAtack){
            targetHp = enemyHp;
        } else {
            targetHp = friendHp;
        }
        for(var i in atack.damage){
            var targetIdx = atack.target[i];
            targetHp[targetIdx] -= atack.damage[i];
        }
    });
}

function getRaigekiOrder(kind){
    switch (kind) {
    /** 連合艦隊空母機動部隊の昼戦 */
    case BattlePhaseKind.COMBINED_BATTLE:
    /** 通常艦隊敵連合艦隊の昼戦*/
    case BattlePhaseKind.COMBINED_EC_BATTLE:
        return 1;
    /** 連合艦隊(機動部隊) vs 敵連合艦隊の昼戦 */
    case BattlePhaseKind.COMBINED_EACH_BATTLE:
        return 2;
    default:
        return -1;
    }
}

function toCombinedKind(type,idx){
    if(type == 0) return 0;
    return type * 10 + (idx < 6 ? 1 : 2);
}

function toFriendCombinedKindString(k){
    switch(k){
        case 0:  return "通常艦隊";
        case 11: return "空母機動部隊(第一艦隊)";
        case 12: return "空母機動部隊(第二艦隊)";
        case 21: return "水上打撃部隊(第一艦隊)";
        case 22: return "水上打撃部隊(第二艦隊)";
        case 31: return "輸送護衛部隊(第一艦隊)";
        case 32: return "輸送護衛部隊(第二艦隊)";
        default: return "？？？";
    }
}

function toEnemyCombinedKindString(k){
    switch(k){
        case 0:  return "通常艦隊";
        case 11: return "連合艦隊(第一艦隊)";
        case 12: return "連合艦隊(第二艦隊)";
        default: return "？？？";
    }
}

function isAbnormalDamage(damage,minDmg,maxDmg,minPropDmg,maxPropDmg,targetHp,minSunkDmg,maxSunkDmg,isFriend,isHp1Obj){
    // ダメージ判定
    if(minDmg - (getData("MODE").STRICT ? 0 : 1) <= damage && damage <= maxDmg + (getData("MODE").STRICT ? 0 : 1)){
        return false;
    }
    // カスダメ判定
    if(minPropDmg <= damage && damage <= maxPropDmg){
        return false;
    }
    // 轟沈ストッパー
    if(!isFriend && (targetHp - damage) > 0 && minSunkDmg <= damage && damage <= maxSunkDmg){
        return false;
    }
    // HP1置き換え
    if(isHp1Obj){
        return false;
    }
    return damage != 0;
}

function isMaelstromMap(battle){
    var area = battle.getMapCellDto().getMap()[0];
    var info = battle.getMapCellDto().getMap()[1];
    return MAELSTROM_MAP_LIST.some(function(x,i,a){
        return area == x[0] && info == x[1];
    });
}

function isException(battle){
    if(battle.isPractice()) return false;
    var area = battle.getMapCellDto().getMap()[0];
    var info = battle.getMapCellDto().getMap()[1];
    // PT初登場マップ除去
    var EXCEPTION_MAP_LIST = [
        [32,2],
        [32,3],
        [32,4],
        [32,5],
    ]
    return EXCEPTION_MAP_LIST.some(function(x,i,a){
        return area == x[0] && info == x[1];
    }) || getData("MODE").EXCEPTION_MAP.some(function(x,i,a){
        return area == x[0] && info == x[1];
    }); // 強制除去
}

function isHp1ReplacementObj(origin,idx){
    if(origin instanceof ShipDto){
        return (idx % 6 != 0 && origin.cond < 20);
    }
    return false;
}

/**
 * ファイルに書き込む
 */
function write(s,p,ini){
    try{
        var pw;
        var path = p === undefined ? Paths.get(LOG_FILE) : p;
        var isIni = ini === undefined ? false : ini;
        if(Files.notExists(path) || isIni){
            pw = new PrintWriter(Files.newBufferedWriter(path,StandardCharsets.UTF_8));
        } else {
            pw = new PrintWriter(Files.newBufferedWriter(path,StandardCharsets.UTF_8,StandardOpenOption.WRITE,StandardOpenOption.APPEND));
        }
        pw.println(s);
        pw.close();
    } catch(e) {
        e.printStackTrace();
    }
}

function toSpAttackKindString(origin,kind){
    switch(Number(kind)){
        case 1: return "連撃(x1.2)";   // 連撃
        case 2: return "主魚CI(x1.3)";   // 主魚CI
        case 3:
            var item2 = new LinkedList(origin.item2);
            if(origin instanceof ShipDto) item2.add(origin.slotExItem);
            var lateTorpedo = item2.stream().filter(function(item){ return item != null }).mapToInt(function(item){ return item.getSlotitemId(); }).filter(function(id){ return id == 213 || id == 214; }).count();
            var radiolocator = item2.stream().filter(function(item){ return item != null }).mapToInt(function(item){ return item.type1; }).filter(function(type1){ return type1 == 42; }).count();
            if(lateTorpedo >= 1 && radiolocator >= 1) return "後電CI(x1.75)"; // 後電CI
            if(lateTorpedo >= 2) return "後魚CI(x1.6)"; // 後魚CI
            return "魚雷CI(x1.5)";   // 魚雷CI
        case 4: return "主副CI(x1.75)";  // 主主副CI
        case 5: return "主砲CI(x2.0)";   // 主砲CI
        default:return "通常攻撃(x1.0)";   // 1回攻撃
    }
}

function iniFile(p){
    try{
        var path = p === undefined ? Paths.get(LOG_FILE) : p;
        if(Files.exists(path)){
            var pw = new PrintWriter(Files.newBufferedWriter(path,StandardCharsets.UTF_8,StandardOpenOption.TRUNCATE_EXISTING));
            pw.close();
        }
    } catch(e) {
        e.printStackTrace();
    }
}

function toSlotString(origin){
    var getLevelText = function(lv){
        switch(lv){
            case 0: return "";
            case 1: return " ★+1";
            case 2: return " ★+2";
            case 3: return " ★+3";
            case 4: return " ★+4";
            case 5: return " ★+5";
            case 6: return " ★+6";
            case 7: return " ★+7";
            case 8: return " ★+8";
            case 9: return " ★+9";
            case 10:return " ★max";
        }
    }
    var getAlvText = function(alv){
        switch(alv){
            case 0: return "";
            case 1: return " |";
            case 2: return " ||";
            case 3: return " |||";
            case 4: return " \\";
            case 5: return " \\\\";
            case 6: return " \\\\\\";
            case 7: return " >>";
        }
    }
    var result = "";
    for(var i = 0;i < origin.item2.size();i++){
        var item = origin.item2.get(i);
        if(item != null){
            var now = ('   ' + (origin instanceof ShipDto ? origin.getOnSlot()[i] : origin.getMaxeq() == null ? '???' : origin.getMaxeq()[i])).slice(-3);
            var max = ('   ' + (origin.getMaxeq() == null ? '???' : origin.getMaxeq()[i])).slice(-3);
            result += "[" + now + "/" + max + "]:" + item.name + getAlvText(item.alv) + getLevelText(item.level);
        } else {
            result += "[   /   ]:装備なし";
        }
        result += crlf;
    }
    if(origin instanceof ShipDto){
        var slotExItem = origin.slotExItem;
        if(slotExItem != null){
            result += " 補   強 :" + slotExItem.name + getAlvText(slotExItem.alv) + getLevelText(slotExItem.level);
        } else {
            result += " 補   強 :装備なし";
        }
        result += crlf;
    }
    return result;
}

function getEnemy(battle){
    var getEnemyList = function(shipKe,eSlots,eParams,eLevel,isKanmusu){
        var list = new LinkedList();
        for(var i = 1;i < shipKe.size();i++){
            var id = Number(shipKe[i]);
            if(id != -1){
                var slot = toIntArray(eSlots[i - 1]);
                var param = toIntArray(eParams[i - 1]);
                // System.out.println("id:"+id+" slot:"+slot+" param:"+param+" lv:"+eLevel[i])
                list.add(new EnemyShipDto(id + (isKanmusu ? 0 : 1000),slot,param,eLevel[i]));
            }
        }
        return list;
    }
    var enemy = new LinkedList();
    if(CHANGE_ID_DATE.before(battle.getBattleDate()) || (battle.isPractice() && isPracticeNewVersion())){
        // System.out.print("AFTER ")
        enemy.addAll(battle.getEnemy());
        for(var i = enemy.size();i < 6;i++) enemy.add(null);
        if(battle.isEnemyCombined()) enemy.addAll(battle.getEnemyCombined());
    } else if(battle.isPractice()){
        var json = battle.getPhase1().getJson();
        var shipKe = json.api_ship_ke;
        var eSlots = json.api_eSlot;
        var eParams = json.api_eParam;
        var eLevel = json.api_ship_lv;
        enemy.addAll(getEnemyList(shipKe,eSlots,eParams,eLevel,true));
    } else {
        // System.out.print("BEFORE ")
        var json = battle.getPhase1().getJson();
        var shipKe = json.api_ship_ke;
        var eSlots = json.api_eSlot;
        var eParams = json.api_eParam;
        var eLevel = json.api_ship_lv;
        enemy.addAll(getEnemyList(shipKe,eSlots,eParams,eLevel));
        for(var i = enemy.size();i < 6;i++) enemy.add(null);
        if(battle.isEnemyCombined()){
            var shipKeCombined = json.api_ship_ke_combined;
            var eSlotsCombined = json.api_eSlot_combined;
            var eParamsCombined = json.api_eParam_combined;
            var eLevelCombined = json.api_ship_lv_combined;
            enemy.addAll(getEnemyList(shipKeCombined,eSlotsCombined,eParamsCombined,eLevelCombined,false));
        }
    }
    return enemy;
}

function toIntArray(arr){
    var result = [];
    for(var i in arr){
        result.push(Number(arr[i]));
    }
    return result;
}

var isPracticeNewVersion = function(){
    var version = Number(AppConstants.VERSION.replaceAll("\.",""));
    // 拡張版と赤版は考慮、あとは知らない
    switch(AppConstants.NAME){
        case "【赤仮】航海日誌": return version > 2344443;
        case "航海日誌"        : return version > 235;
        default                : return true;
    }
}

var isNewVersion = function(){
    var version = Number(AppConstants.VERSION.replaceAll("\.",""));
    // 拡張版と赤版は考慮、あとは知らない
    switch(AppConstants.NAME){
        case "【赤仮】航海日誌": return version > 2344443;
        case "航海日誌"        : return version > 234;
        default                : return true;
    }
}

function isPt(target){
    switch(target.getShipId()){
        case 1637:
        case 1638:
        case 1639:
        case 1640:
            return true;
        default:
            return false;
    }
}

function getJstCalendar(year, month, date, hourOfDay, minute, second){
    var c = Calendar.getInstance(TimeZone.getTimeZone("JST"));
    c.clear();
    c.set(year, month - 1, date, hourOfDay, minute, second);
    return c;
}

function toDispString(result){
    if(result == null) return "";
    switch(getData("MODE").DISP){
        case 1: return "？";
        case 2: return String(result.match(/[\+,\-]\d/)[0].charAt(0));
        case 3: return String(result.match(/[\+,\-]\d/)[0]);
        case 4: return String(result);
        default:return "";
    }
}

/**
 * 拡張版(無印)用
 * 以前のバージョンにはcombinedKindは存在しないので、自力で算出する。
 */
function calcCombinedKind(battle){
    // 連合艦隊ではない場合
    if(!battle.isCombined()) return 0;
    // フェーズが存在しない場合
    if(battle.getPhaseList().isEmpty()) return -1;
    // 最初のフェーズ
    var phase = battle.getPhaseList().get(0);
    // 夜戦スタートか
    if(phase.isNight()) return -1;
    // 水上打撃部隊のAPIか
    if(phase.getApi().equals(DataType.COMBINED_BATTLE_WATER.getApiName()) || phase.getApi().equals(DataType.COMBINED_EACH_BATTLE_WATER.getApiName())) return 2;
    // 空母機動部隊or輸送護衛部隊のAPIか
    if(phase.getApi().equals(DataType.COMBINED_BATTLE.getApiName()) || phase.getApi().equals(DataType.COMBINED_EACH_BATTLE.getApiName())){
        // 第一艦隊or第二艦隊が存在しない場合
        if(battle.getDock() == null || battle.getDockCombined() == null) return -1;
        // 第一艦隊取得
        var ships = battle.getDock().getShips();
        // 日付取得
        var date = battle.getBattleDate();
        // 空母数取得
        var cv = ships.stream().filter(function(ship){ return ship != null; }).mapToInt(function(ship){ return ship.stype; }).filter(function(stype){ return stype == 7 || stype == 11 || stype == 18 }).count();
        // 空母数2以上だと空母機動部隊振り分け
        if(cv >= 2) return 1;
        // 輸送護衛部隊追加日以降か
        if(ADD_TRANSPORTATION_FORCE_DATE.before(date)) return 3;
    }
    // 不明
    return -1;
}

function updateFile(){
    if(getData("isUpdate") || !getData("MODE").AUTO_UPDATE) return;
    var nowVersion = IOUtils.toString(URI.create(UPDATE_CHECK_URL), Charset.forName("UTF-8"));
    setTmpData("isUpdate",true);
    if(VERSION >= Number(nowVersion)) return;
    // URLを構築します。引数にダウンロード先のURLを指定します。
    var url = new URL(FILE_URL);
    var urlConnection = HttpURLConnection.class.cast(url.openConnection());
    urlConnection.connect();
    Files.copy(urlConnection.getInputStream(), Paths.get(EXECUTABLE_FILE), StandardCopyOption.REPLACE_EXISTING); //上書き設定
    loadSetting();
}

function loadSetting(){
    //if(getData("isSetting")) return;
    //setTmpData("isSetting",true);
    var userPath = Paths.get(SETTING_FILE);
    var user = {};
    var result = {};
    if(Files.exists(userPath)){
        user = JSON.parse(String(Files.lines(userPath).collect(Collectors.joining())).replace(/\uFEFF/,""));
    }
    
    Object.keys(MODE).forEach(function(key){
        if(key in user){
            result[key] = user[key];
        } else {
            result[key] = MODE[key];
        }
    });
    //print(JSON.stringify(result, null , "    "))
    setTmpData("MODE",result);
    write(String(JSON.stringify(result, null , "    ")).replace(/\n/g,crlf), userPath, true);
}

function getBulgeBonus(item2){
    return item2.stream().filter(function(item){
        return item != null;
    }).mapToDouble(function(item){
        switch(item.slotitemId){
            case 72:  // 中型バルジ
            case 203: // 新中型バルジ
                return 0.2 * item.level;
            case 73:  // 大型バルジ
            case 204: // 新大型バルジ
                return 0.3 * item.level;
            default:
                return 0;
        }
    }).sum();
}

function getBakuraiBonus(item2){
    return get95BakuraiNum(item2) * Math.sqrt(2) + get2BakuraiNum(item2) * Math.sqrt(5);
}