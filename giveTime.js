// Import the jalali-moment package
const moment = require('jalali-moment');


function giveTime(){
    // Get the current date in ISO format
    const isoDate = new Date().toISOString();

    // Convert the ISO date to Jalali date format
    const jalaliDate = moment(isoDate, 'YYYY-MM-DDTHH:mm:ss.sssZ').locale('fa').format('YYYY-MM-DDTHH:mm:ss');

    return `${jalaliDate}.${isoDate[isoDate.length-4]}${isoDate[isoDate.length-3]}${isoDate[isoDate.length-2]}${isoDate[isoDate.length-1]}`;
}

module.exports = giveTime;