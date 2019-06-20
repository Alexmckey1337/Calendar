const week_days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday',]
const localStorageName = 'calendar-events'
class calendar {
    constructor(options){
        this.options = options
        this.elements = {
            days: this.getFirstElementInsideIdByClass('calendar-days'),
            week:this.getFirstElementInsideIdByClass('calendar-week'),
            month:this.getFirstElementInsideIdByClass('calendar-month'),
            year:this.getFirstElementInsideIdByClass('calendar-current-year'),
            eventList:this.getFirstElementInsideIdByClass('current-day-events'),
            eventField:this.getFirstElementInsideIdByClass('add-event-day-field'),
            eventAddBtn:this.getFirstElementInsideIdByClass('add-event-day-field-btn'),
            currentDay:this.getFirstElementInsideIdByClass('calendar-left-side-day'),
            currentWeekDay:this.getFirstElementInsideIdByClass('calendar-left-side-day-of-week'),
            prevYear:this.getFirstElementInsideIdByClass('calendar-change-year-slider-prev'),
            nextYear:this.getFirstElementInsideIdByClass('calendar-change-year-slider-next'),
        }
        this.eventList = JSON.parse(localStorage.getItem(localStorageName)) || {}
        this.date =+ new Date()
        this.options.maxDays = 37;
        this.init()
    }
    init(){
        if(!this.options.id) return false;
        this.eventsTrigger()
        this.drawAll()
    }

    drawAll(){
        this.drawWeekDays();
        this.drawMonths();
        this.drawDays();
        this.drawYearAndCurrentDay()
        this.drawEvents()
    }

    drawEvents(){
        let calendar = this.getCalendar()
        let eventList =this.eventList[calendar.active.formatted] || ['There are not any events']
        let eventTemplate = ''
        eventList.forEach(item=>{
            eventTemplate += `<li>${item}</li>`
        })

        this.elements.eventList.innerHTML = eventTemplate;
    }

    drawYearAndCurrentDay() {
        let calendar = this.getCalendar()
        this.elements.year.innerHTML = calendar.active.year
        this.elements.currentDay.innerHTML = calendar.active.day
        this.elements.currentWeekDay.innerHTML = week_days[calendar.active.week]
    }

    drawDays() {
        let calendar = this.getCalendar();

        let latestDaysInPrevMonth = this.range(calendar.active.startWeek).map((day, idx) => {
            return {
                dayNumber: this.countOfDaysInMonth(calendar.prevMonth) - idx,
                month: new Date(calendar.prevMonth).getMonth(),
                year: new Date(calendar.prevMonth).getFullYear(),
                currentMonth: false
            }
        }).reverse();

        let daysInActiveMonth = this.range(calendar.active.days).map((day, idx) => {
            let dayNumber = idx + 1;
            let today = new Date();
            return {
                dayNumber,
                today: today.getDate() === dayNumber && today.getFullYear() === calendar.active.year && today.getMonth() === calendar.active.month,
                month: calendar.active.month,
                year: calendar.active.year,
                selected: calendar.active.day === dayNumber,
                currentMonth: true
            }
        });


        let countOfDays = this.options.maxDays - (latestDaysInPrevMonth.length + daysInActiveMonth.length);
    
        let daysInNextMonth = this.range(countOfDays).map((day, idx) => {
            return {
                dayNumber: idx + 1,
                month: new Date(calendar.nextMonth).getMonth(),
                year: new Date(calendar.nextMonth).getFullYear(),
                currentMonth: false
            }
        });

        let days = [...latestDaysInPrevMonth, ...daysInActiveMonth, ...daysInNextMonth];
        days = days.map(day => {
            let newDayParams = day;
            let formatted = this.getFormattedDate(new Date(`${Number(day.month) + 1}/${day.dayNumber}/${day.year}`));
            newDayParams.hasEvent = this.eventList[formatted];
            return newDayParams;
        });

        let daysTemplate = "";
        days.forEach(day => {
            daysTemplate += `<li class="${day.currentMonth ? '' : 'another-month'}${day.today ? ' active-day ' : ''}${day.selected ? 'selected-day' : ''}${day.hasEvent ? ' event-day' : ''}" data-day="${day.dayNumber}" data-month="${day.month}" data-year="${day.year}"></li>`
        });

        this.elements.days.innerHTML = daysTemplate;
    }


    drawMonths(){
        let availableMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let monthTemplate = ''
        let calendar = this.getCalendar();
        availableMonths.forEach((month,idx)=>{
            monthTemplate += `<li class="${idx === calendar.active.month ? 'active' : ''}" data-month="${idx}">${month}</li>`
        })

        this.elements.month.innerHTML = monthTemplate;
    }

    drawWeekDays(){
        let weekTemplate = ''
        week_days.forEach(weekDay=>{
            weekTemplate += `<li>${weekDay.slice(0,3)}</li>`
        })
        this.elements.week.innerHTML = weekTemplate
    }

    eventsTrigger() {
        this.elements.prevYear.addEventListener('click',e=>{
            let calendar = this.getCalendar();
            this.updateTime(calendar.prevYear);
            this.drawAll()
        })
        this.elements.nextYear.addEventListener('click',e=>{
            let calendar = this.getCalendar();
            this.updateTime(calendar.nextYear);
            this.drawAll()
        })
        this.elements.month.addEventListener('click',e=>{
            let calendar = this.getCalendar();
            let month = e.srcElement.getAttribute('data-month');
            if(!month || calendar.active.month == month) return false
            let newMonth = new Date(calendar.active.tm).setMonth(month)
            this.updateTime(newMonth);
            this.drawAll()
        })
        document.getElementsByClassName('todayBtn')[0].addEventListener('click',e=>{
           let date = new Date()
           let day = date.getDate()
           let month = date.getMonth()
           let year= date.getFullYear()
           this.updateTime(`${Number(month)+1}/${day}/${year}`)
           this.drawAll()
        })
        this.elements.days.addEventListener('click',e=>{
            let element = e.srcElement;
            let day = element.getAttribute('data-day')
            let month = element.getAttribute('data-month')
            let year = element.getAttribute('data-year')
            let modal = document.getElementById('modal')
            if(!day) return false
            let strDate = `${Number(month)+1}/${day}/${year}`
            this.updateTime(strDate);
            this.drawAll()
            console.log(strDate)
            modal.style.display = 'block'
        })
        document.getElementsByClassName('close')[0].addEventListener('click',e=>{
            modal.style.display = 'none'
        })
        window.addEventListener('click',e=>{
            if (e.target == modal){
                modal.style.display = 'none'
            }
        })
        this.elements.eventAddBtn.addEventListener('click',e=>{
            let fieldValue = this.elements.eventField.value
            if(!fieldValue) return false
            let dateFormatted = this.getFormattedDate(new Date(this.date))
            if(!this.eventList[dateFormatted]) this.eventList[dateFormatted] = []
            this.eventList[dateFormatted].push(fieldValue)
            localStorage.setItem(localStorageName,JSON.stringify(this.eventList))
            this.elements.eventField.value = ''
            modal.style.display = 'none'
            this.drawAll()
        })
    }

    updateTime(time){
        this.date = +new Date(time)
    }
    getCalendar(){
        let time = new Date(this.date)
        return{
            active:{
                days:this.countOfDaysInMonth(time),
                startWeek:this.getStartedDayOfWeekByTime(time),
                day:time.getDate(),
                week:time.getDay(),
                month:time.getMonth(),
                year:time.getFullYear(),
                formatted:this.getFormattedDate(time),
                tm: +time
            },
            prevMonth: new Date(time.getFullYear(),time.getMonth()-1, 1),
            nextMonth: new Date(time.getFullYear(),time.getMonth()+1, 1),
            prevYear: new Date(new Date(time).getFullYear()-1,0,1),
            nextYear: new Date(new Date(time).getFullYear()+1,0,1)
            
        }
    }
    countOfDaysInMonth(time){
        let date = this.getMonthAndYear(time)
        return new Date(date.year, date.month + 1, 0).getDate() ;
    }
    

    getStartedDayOfWeekByTime(time){
        let date = this.getMonthAndYear(time)
        return new Date(date.year,date.month, 1).getDay();
    }

    getMonthAndYear(time){
        let date = new Date(time)
        return {
            year: date.getFullYear(),
            month: date.getMonth()
        }
    }

    getFormattedDate(date){
        return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
    }

    range(number) {
        return new Array(number).fill().map((e, i) => i);
    }

    getFirstElementInsideIdByClass(className){
        return document.getElementById(this.options.id).getElementsByClassName(className)[0];
    }

}

(function (){
    new calendar({
        id:'calendar'
    })
})();