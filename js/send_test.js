/*
 * 模拟websockt数据
 */

var pause = false;


function getTwoDifferentRandomNum( max ){
    var a = Math.ceil(Math.random()*max );
    var b;
    do{
        b = Math.ceil(Math.random()*max );
    }while(a == b);
    return [a, b];
}


function test(){


    var teams = getTwoDifferentRandomNum( 12 );

    var data = {
        attacker : teams[0],
        defender : teams[1],
        service : Math.ceil(Math.random()*6),
        status : Math.round( Math.random() )
    }
    XCTF.attack( data.attacker, data.defender, data.service, data.status );
    UI.attack( data.attacker, data.defender, data.service, data.status );

    if( !pause )
        setTimeout(test,200);  
}

function start(){
    if(!XCTF.isReady()){
        setTimeout(start,1000);
        return;
    }
    test();
}

function init(){
    $('.playBtn').click(function(event) {
        $(this).hide().siblings().show();
        pause = false;
        test();
    });

    $('.stopBtn').click(function(event) {
        $(this).hide().siblings().show();
        pause = true;
    });
}


jQuery(document).ready(function() {  
    init();
    UI.init();  
    XCTF.init();
    start();
});