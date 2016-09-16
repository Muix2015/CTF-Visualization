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

    UI.init();  
    XCTF.init( {
        callback: test,
        progress: {
            set: function( value ) {
                $( '.progressBar' ).width( value );
            },
            remove: function(){
                $( '.progressMask' ).hide();
            }
        }
    } );

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

    start();

});