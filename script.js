const themeBtn = document.getElementById("themeBtn");

let currentPage = "home";

// تغییر حالت روشن و تاریک
themeBtn.addEventListener("click", () => {

    const isDark = document.body.classList.toggle("dark");

    const theme = isDark ? "dark" : "light";

    themeBtn.textContent = isDark ? "☀️" : "🌙";

    localStorage.setItem("mathmateTheme", theme);

    themeOptions.forEach((button) => {
        button.classList.remove("active");

        if (button.dataset.theme === theme) {
            button.classList.add("active");
        }
    });

});

// فعال شدن آیتم‌های نوار پایین
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((item) => {
    item.addEventListener("click", () => {

        navItems.forEach((nav) => {
            nav.classList.remove("active");
        });

        item.classList.add("active");

    });
});

// دکمه شروع
const startBtn = document.querySelector(".start-btn");

startBtn.addEventListener("click", () => {
    document.querySelector(".tools-section").scrollIntoView({
        behavior: "smooth"
    });
});

// ================= CALCULATOR PAGE =================

const calculatorCard = document.getElementById("calculatorCard");
const calculatorPage = document.getElementById("calculatorPage");
const calculatorBack = document.getElementById("calculatorBack");

calculatorCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش ماشین حساب
    calculatorPage.classList.add("show");

    // مخفی کردن نوار پایین
    document.querySelector(".bottom-nav").style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
calculatorBack.addEventListener("click", () => {

    // مخفی کردن ماشین حساب
    calculatorPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // صفحه ابزارها را دوباره نشان بده
        toolsPage.classList.add("show");

    } else {

        // صفحه خانه را دوباره نشان بده
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    // نمایش نوار پایین
    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= CALCULATOR LOGIC =================

const calcDisplay = document.getElementById("calculatorDisplay");
const calcButtons = document.querySelectorAll(".calc-btn");

let currentExpression = "";

calcButtons.forEach((button) => {
    button.addEventListener("click", () => {


        const value = button.dataset.value;

        // پاک کردن کامل
        if (value === "C") {
            currentExpression = "";
            calcDisplay.textContent = "0";
            return;
        }

        // پاک کردن آخرین کاراکتر
        if (value === "DEL") {
            currentExpression = currentExpression.slice(0, -1);

            if (currentExpression === "") {
                calcDisplay.textContent = "0";
            } else {
                calcDisplay.textContent = currentExpression;
            }

            return;
        }

        // محاسبه نتیجه
        if (value === "=") {
            try {
                if (currentExpression === "") return;

                const result = Function(
                    `"use strict"; return (${currentExpression})`
                )();

                currentExpression = String(result);
                calcDisplay.textContent = currentExpression;

            } catch (error) {
                calcDisplay.textContent = "خطا";
                currentExpression = "";
            }

            return;
        }

        // اضافه کردن عدد یا عملگر
        currentExpression += value;

        // نمایش علامت‌های زیباتر
        let displayExpression = currentExpression
            .replace(/\*/g, "×")
            .replace(/\//g, "÷");

        calcDisplay.textContent = displayExpression;
    });
});

// ================= MULTIPLES PAGE =================

const multiplesCard = document.getElementById("multiplesCard");
const multiplesPage = document.getElementById("multiplesPage");
const multiplesBack = document.getElementById("multiplesBack");

multiplesCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه مضرب‌ها
    multiplesPage.classList.add("show");

    // مخفی کردن نوار پایین
    document.querySelector(".bottom-nav").style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت از مضرب‌ها
multiplesBack.addEventListener("click", () => {

    multiplesPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= MULTIPLES LOGIC =================

const multipleNumber = document.getElementById("multipleNumber");
const multipleCount = document.getElementById("multipleCount");
const calculateMultiples = document.getElementById("calculateMultiples");
const multiplesResult = document.getElementById("multiplesResult");
const multiplesList = document.getElementById("multiplesList");


calculateMultiples.addEventListener("click", () => {

    // گرفتن عدد واردشده
    const number = Number(multipleNumber.value);
    const count = Number(multipleCount.value);

    // بررسی اینکه کاربر عدد وارد کرده باشد
    if (!multipleNumber.value || !multipleCount.value) {
        alert("لطفاً هر دو قسمت را کامل کن 🙂");
        return;
    }

    // بررسی معتبر بودن اعداد
    if (!Number.isFinite(number) || !Number.isInteger(count) || count <= 0) {
        alert("لطفاً عددهای معتبر وارد کن 🙂");
        return;
    }

    // پاک کردن نتایج قبلی
    multiplesList.innerHTML = "";

    // ساخت مضرب‌ها
    for (let i = 1; i <= count; i++) {

        const multiple = number * i;

        const item = document.createElement("div");

        item.classList.add("multiple-item");

        item.textContent = multiple;

        multiplesList.appendChild(item);
    }

    // نمایش بخش نتیجه
    multiplesResult.classList.add("show");
});

// ================= GEOMETRY PAGE =================

const geometryCard = document.getElementById("geometryCard");
const geometryPage = document.getElementById("geometryPage");
const geometryBack = document.getElementById("geometryBack");


// باز کردن صفحه مساحت و محیط
geometryCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه هندسه
    geometryPage.classList.add("show");

    // مخفی کردن نوار پایین
    document.querySelector(".bottom-nav").style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
geometryBack.addEventListener("click", () => {

    // مخفی کردن صفحه هندسه
    geometryPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

    } else {

        // نمایش صفحه خانه
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    // نمایش نوار پایین
    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= GEOMETRY LOGIC =================

const shapeCards = document.querySelectorAll(".shape-card");
const geometryInputs = document.getElementById("geometryInputs");
const calculateGeometry = document.getElementById("calculateGeometry");
const geometryResult = document.getElementById("geometryResult");
const areaResult = document.getElementById("areaResult");
const perimeterResult = document.getElementById("perimeterResult");

let selectedShape = "rectangle";


// نمایش ورودی‌های مربوط به هر شکل
function showGeometryInputs(shape) {

    if (shape === "rectangle") {

        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>طول</label>
                <input type="number" id="length" placeholder="مثلاً 10">
            </div>

            <div class="geometry-input">
                <label>عرض</label>
                <input type="number" id="width" placeholder="مثلاً 5">
            </div>
        `;
    }


    else if (shape === "square") {

        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>اندازه ضلع</label>
                <input type="number" id="side" placeholder="مثلاً 8">
            </div>
        `;
    }


    else if (shape === "triangle") {

        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>قاعده</label>
                <input type="number" id="base" placeholder="مثلاً 10">
            </div>

            <div class="geometry-input">
                <label>ارتفاع</label>
                <input type="number" id="height" placeholder="مثلاً 6">
            </div>

            <div class="geometry-input">
                <label>ضلع اول</label>
                <input type="number" id="side1" placeholder="مثلاً 8">
            </div>

            <div class="geometry-input">
                <label>ضلع دوم</label>
                <input type="number" id="side2" placeholder="مثلاً 7">
            </div>
        `;
    }


    else if (shape === "circle") {

        geometryInputs.innerHTML = `
            <div class="geometry-input">
                <label>شعاع</label>
                <input type="number" id="radius" placeholder="مثلاً 5">
            </div>
        `;
    }
}


// انتخاب شکل
shapeCards.forEach((card) => {

    card.addEventListener("click", () => {

        // حذف انتخاب قبلی
        shapeCards.forEach((item) => {
            item.classList.remove("active");
        });

        // انتخاب شکل جدید
        card.classList.add("active");

        selectedShape = card.dataset.shape;

        // مخفی کردن نتیجه قبلی
        geometryResult.classList.remove("show");

        // نمایش ورودی‌های جدید
        showGeometryInputs(selectedShape);
    });
});


// نمایش ورودی اولیه مستطیل
showGeometryInputs(selectedShape);


// محاسبه
calculateGeometry.addEventListener("click", () => {

    let area;
    let perimeter;


    // مستطیل
    if (selectedShape === "rectangle") {

        const length = Number(document.getElementById("length").value);
        const width = Number(document.getElementById("width").value);

        if (length <= 0 || width <= 0) {
            alert("لطفاً طول و عرض معتبر وارد کن 🙂");
            return;
        }

        area = length * width;
        perimeter = 2 * (length + width);
    }


    // مربع
    else if (selectedShape === "square") {

        const side = Number(document.getElementById("side").value);

        if (side <= 0) {
            alert("لطفاً اندازه ضلع معتبر وارد کن 🙂");
            return;
        }

        area = side * side;
        perimeter = 4 * side;
    }


    // مثلث
    else if (selectedShape === "triangle") {

        const base = Number(document.getElementById("base").value);
        const height = Number(document.getElementById("height").value);
        const side1 = Number(document.getElementById("side1").value);
        const side2 = Number(document.getElementById("side2").value);

        if (base <= 0 || height <= 0 || side1 <= 0 || side2 <= 0) {
            alert("لطفاً همه اندازه‌ها را درست وارد کن 🙂");
            return;
        }

        area = (base * height) / 2;
        perimeter = base + side1 + side2;
    }


    // دایره
    else if (selectedShape === "circle") {

        const radius = Number(document.getElementById("radius").value);

        if (radius <= 0) {
            alert("لطفاً شعاع معتبر وارد کن 🙂");
            return;
        }

        area = Math.PI * radius * radius;
        perimeter = 2 * Math.PI * radius;
    }


    // نمایش نتیجه
    areaResult.textContent = area.toFixed(2);
    perimeterResult.textContent = perimeter.toFixed(2);

    geometryResult.classList.add("show");
});

// ================= GCD & LCM PAGE =================

const gcdLcmCard = document.getElementById("gcdLcmCard");
const gcdLcmPage = document.getElementById("gcdLcmPage");
const gcdLcmBack = document.getElementById("gcdLcmBack");


// باز کردن صفحه ب.م.م و ک.م.م
gcdLcmCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ب.م.م و ک.م.م
    gcdLcmPage.classList.add("show");

    // مخفی کردن نوار پایین
    document.querySelector(".bottom-nav").style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// دکمه بازگشت
gcdLcmBack.addEventListener("click", () => {

    gcdLcmPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= GCD & LCM LOGIC =================

const gcdNumber1 = document.getElementById("gcdNumber1");
const gcdNumber2 = document.getElementById("gcdNumber2");

const calculateGcdLcm = document.getElementById("calculateGcdLcm");

const gcdLcmResult = document.getElementById("gcdLcmResult");
const gcdResult = document.getElementById("gcdResult");
const lcmResult = document.getElementById("lcmResult");


// تابع محاسبه ب.م.م با الگوریتم اقلیدس
function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

        let temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}


// تابع محاسبه ک.م.م
function lcm(a, b) {

    return Math.abs(a * b) / gcd(a, b);
}


// کلیک روی دکمه محاسبه
calculateGcdLcm.addEventListener("click", () => {

    const number1 = Number(gcdNumber1.value);
    const number2 = Number(gcdNumber2.value);


    // بررسی معتبر بودن ورودی‌ها
    if (
        !gcdNumber1.value ||
        !gcdNumber2.value ||
        !Number.isInteger(number1) ||
        !Number.isInteger(number2) ||
        number1 <= 0 ||
        number2 <= 0
    ) {

        alert("لطفاً دو عدد صحیح و مثبت وارد کن 🙂");

        return;
    }


    // محاسبه ب.م.م
    const gcdValue = gcd(number1, number2);

    // محاسبه ک.م.م
    const lcmValue = lcm(number1, number2);


    // نمایش نتیجه
    gcdResult.textContent = gcdValue;
    lcmResult.textContent = lcmValue;

    gcdLcmResult.classList.add("show");
});

// ================= LEARNING PAGE =================

const learningCard = document.getElementById("learningCard");
const learningPage = document.getElementById("learningPage");
const learningBack = document.getElementById("learningBack");

const learningSearch = document.getElementById("learningSearch");
const searchAparat = document.getElementById("searchAparat");
const searchYoutube = document.getElementById("searchYoutube");


// باز کردن صفحه آموزش
learningCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه آموزش
    learningPage.classList.add("show");

    // مخفی کردن نوار پایین
    document.querySelector(".bottom-nav").style.display = "none";

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// بازگشت از صفحه آموزش
learningBack.addEventListener("click", () => {

    // مخفی کردن صفحه آموزش
    learningPage.classList.remove("show");

    // اگر از صفحه ابزارها آمده بودیم
    if (currentPage === "tools") {

        // دوباره صفحه ابزارها را نمایش بده
        toolsPage.classList.add("show");

    } else {

        // در غیر این صورت صفحه خانه را نمایش بده
        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";
    }

    // نمایش نوار پایین
    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// جستجو در آپارات
searchAparat.addEventListener("click", () => {

    const searchText = learningSearch.value.trim();

    if (searchText === "") {
        alert("اول موضوع آموزشی مورد نظرت را وارد کن 🙂");
        return;
    }

    const q = encodeURIComponent(searchText);

    const aparatUrl =
        "https://www.aparat.com/search/" + q;

    window.open(aparatUrl, "_blank");
});


// جستجو در یوتیوب
searchYoutube.addEventListener("click", () => {

    const searchText = learningSearch.value.trim();

    if (searchText === "") {
        alert("اول موضوع آموزشی مورد نظرت را وارد کن 🙂");
        return;
    }

    const youtubeUrl =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(searchText);

    window.open(youtubeUrl, "_blank");
});

// ================= FACTORS PAGE =================

const factorsCard = document.getElementById("factorsCard");

const factorsPage = document.getElementById("factorsPage");

const factorsBack = document.getElementById("factorsBack");


// باز کردن صفحه شمارنده‌ها

factorsCard.addEventListener("click", () => {

    currentPage = "home";

    // مخفی کردن صفحه اصلی

    document.querySelector(".header").style.display = "none";

    document.querySelector(".welcome-card").style.display = "none";

    document.querySelector(".tools-section").style.display = "none";

    document.querySelector(".learning-card").style.display = "none";


    // نمایش صفحه شمارنده‌ها

    factorsPage.classList.add("show");


    // مخفی کردن نوار پایین

    document.querySelector(".bottom-nav").style.display = "none";


    // رفتن به بالای صفحه

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= بازگشت =================

factorsBack.addEventListener("click", () => {

    factorsPage.classList.remove("show");

    if (currentPage === "tools") {

        toolsPage.classList.add("show");

    } else {

        document.querySelector(".header").style.display = "flex";
        document.querySelector(".welcome-card").style.display = "flex";
        document.querySelector(".tools-section").style.display = "block";
        document.querySelector(".learning-card").style.display = "flex";

    }

    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= FACTORS LOGIC =================

const factorsNumber =
    document.getElementById("factorsNumber");

const calculateFactors =
    document.getElementById("calculateFactors");

const factorsResult =
    document.getElementById("factorsResult");

const factorsList =
    document.getElementById("factorsList");


// محاسبه شمارنده‌ها

calculateFactors.addEventListener("click", () => {

    const number = Number(factorsNumber.value);


    // بررسی عدد

    if (
        !factorsNumber.value ||
        !Number.isInteger(number) ||
        number <= 0
    ) {

        alert("لطفاً یک عدد صحیح و مثبت وارد کن 🙂");

        return;
    }


    // پاک کردن نتیجه قبلی

    factorsList.innerHTML = "";


    // پیدا کردن شمارنده‌ها

    for (let i = 1; i <= number; i++) {

        if (number % i === 0) {

            const item =
                document.createElement("div");

            item.classList.add("factor-item");

            item.textContent = i;

            factorsList.appendChild(item);
        }

    }


    // نمایش نتیجه

    factorsResult.classList.add("show");

});

function hideAllPages() {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("show");
    });
}

// ================= TOOLS NAVIGATION =================***

const toolsNav = document.getElementById("toolsNav");
const toolsPage = document.getElementById("toolsPage");
const moreToolsBtn = document.getElementById("moreToolsBtn");
const startLearningCard = document.getElementById("startLearningCard");

function activateToolsNav() {

    // غیرفعال کردن همه دکمه‌های نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });

    // فعال کردن ابزارها
    toolsNav.classList.add("active");

}

// رفتن به صفحه ابزارها از نوار پایین
toolsNav.addEventListener("click", () => {

    currentPage = "tools";

    activateToolsNav();

    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ابزارها
    toolsPage.classList.add("show");

    // نوار پایین باقی بماند
    document.querySelector(".bottom-nav").style.display = "flex";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= HOME NAVIGATION =================

const homeNav = document.getElementById("homeNav");

homeNav.addEventListener("click", () => {

    // مخفی کردن تمام صفحه‌های جداگانه
    hideAllPages();

    // نمایش دوباره صفحه خانه
    document.querySelector(".header").style.display = "flex";
    document.querySelector(".welcome-card").style.display = "flex";
    document.querySelector(".tools-section").style.display = "block";
    document.querySelector(".learning-card").style.display = "flex";

    // فعال کردن خانه در نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });

    homeNav.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= MORE TOOLS BUTTON =================

moreToolsBtn.addEventListener("click", () => {

    currentPage = "tools";

    activateToolsNav();

    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ابزارها
    toolsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= START LEARNING CARD =================

startLearningCard.addEventListener("click", () => {

    currentPage = "tools";

    activateToolsNav();

    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه ابزارها
    toolsPage.classList.add("show");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= VIDEOS NAVIGATION =================

const videosNav = document.getElementById("videosNav");
const videosPage = document.getElementById("videosPage");

videosNav.addEventListener("click", () => {

    currentPage = "videos";

    // بستن تمام صفحه‌های جداگانه
    hideAllPages();

    // مخفی کردن صفحه خانه
    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

    // نمایش صفحه فیلم‌های آموزشی
    videosPage.classList.add("show");

    // فعال کردن آموزش در نوار پایین
    navItems.forEach((nav) => {
        nav.classList.remove("active");
    });

    videosNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= TOOLS PAGE CARDS =================

// کارت‌های داخل صفحه ابزارها
const toolsCalculator = document.getElementById("toolsCalculator");
const toolsGeometry = document.getElementById("toolsGeometry");
const toolsGcdLcm = document.getElementById("toolsGcdLcm");
const toolsMultiples = document.getElementById("toolsMultiples");
const toolsFactors = document.getElementById("toolsFactors");
const toolsLearning = document.getElementById("toolsLearning");


// تابع مخفی کردن صفحه ابزارها
function closeToolsPage() {
    toolsPage.classList.remove("show");
}


// ماشین حساب
toolsCalculator.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    calculatorPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// مساحت و محیط
toolsGeometry.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    geometryPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ب.م.م و ک.م.م
toolsGcdLcm.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    gcdLcmPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// مضرب‌ها
toolsMultiples.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    multiplesPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// شمارنده‌ها
toolsFactors.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    factorsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// آموزش
toolsLearning.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    learningPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

/* ================= DATE PAGE ================= */

const toolsDate = document.getElementById("toolsDate");

const datePage = document.getElementById("datePage");

const dateBack = document.getElementById("dateBack");


// باز کردن صفحه تبدیل تاریخ

toolsDate.addEventListener("click", () => {

    currentPage = "tools";

    hideAllPages();

    closeToolsPage();

    datePage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// بازگشت از صفحه تبدیل تاریخ

dateBack.addEventListener("click", () => {

    datePage.classList.remove("show");

    toolsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// ================= SETTINGS & ABOUT =================

// صفحات
const settingsPage = document.getElementById("settingsPage");
const aboutPage = document.getElementById("aboutPage");

// دکمه‌های نوار پایین
const settingsNav = document.getElementById("settingsNav");
const aboutNav = document.getElementById("aboutNav");


// ================= مخفی کردن صفحه اصلی =================

function hideHomePage() {

    document.querySelector(".header").style.display = "none";
    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".tools-section").style.display = "none";
    document.querySelector(".learning-card").style.display = "none";

}


// ================= نمایش صفحه تنظیمات =================

function showSettingsPage() {

    currentPage = "settings";

    // مخفی کردن تمام صفحه‌های دیگر
    hideAllPages();

    // مخفی کردن صفحه اصلی
    hideHomePage();

    // نمایش تنظیمات
    settingsPage.classList.add("show");

    // فعال کردن دکمه تنظیمات
    navItems.forEach(nav => {
        nav.classList.remove("active");
    });

    settingsNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// کلیک روی تنظیمات
if (settingsNav) {

    settingsNav.addEventListener("click", () => {

        showSettingsPage();

    });

}


// ================= نمایش صفحه درباره ما =================

function showAboutPage() {

    currentPage = "about";

    // مخفی کردن تمام صفحه‌های دیگر
    hideAllPages();

    // مخفی کردن صفحه اصلی
    hideHomePage();

    // نمایش صفحه درباره ما
    aboutPage.classList.add("show");

    // فعال کردن دکمه درباره ما
    navItems.forEach(nav => {
        nav.classList.remove("active");
    });

    aboutNav.classList.add("active");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// کلیک روی درباره ما
if (aboutNav) {

    aboutNav.addEventListener("click", () => {

        showAboutPage();

    });

}


// ================= FONT SIZE =================

const fontSizeButtons =
    document.querySelectorAll(".font-size-btn");


// تغییر اندازه نوشته
function changeFontSize(size) {

    document.body.classList.remove(
        "font-small",
        "font-normal",
        "font-large"
    );

    document.body.classList.add(`font-${size}`);

    localStorage.setItem("mathmateFontSize", size);
}


// کلیک روی دکمه‌های اندازه نوشته
fontSizeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const size = button.dataset.size;

        // تغییر اندازه
        changeFontSize(size);

        // حذف active قبلی
        fontSizeButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // فعال کردن دکمه جدید
        button.classList.add("active");

    });

});


// بارگذاری اندازه ذخیره‌شده
const savedFontSize =
    localStorage.getItem("mathmateFontSize") || "normal";


// اعمال اندازه
changeFontSize(savedFontSize);


// فعال کردن دکمه درست
fontSizeButtons.forEach(button => {

    if (button.dataset.size === savedFontSize) {

        button.classList.add("active");

    } else {

        button.classList.remove("active");

    }

});


// ================= THEME SETTINGS =================

const themeOptions =
    document.querySelectorAll(".theme-option");


// تغییر حالت روشن و تاریک
function changeTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add("dark");

        // تغییر آیکون
        if (themeBtn) {
            themeBtn.textContent = "☀️";
        }

    } else {

        document.body.classList.remove("dark");

        // تغییر آیکون
        if (themeBtn) {
            themeBtn.textContent = "🌙";
        }

    }

    // ذخیره تنظیم
    localStorage.setItem(
        "mathmateTheme",
        theme
    );

}


// کلیک روی دکمه‌های حالت
themeOptions.forEach(button => {

    button.addEventListener("click", () => {

        const theme = button.dataset.theme;

        // تغییر حالت
        changeTheme(theme);

        // حذف active قبلی
        themeOptions.forEach(btn => {
            btn.classList.remove("active");
        });

        // فعال کردن دکمه انتخاب‌شده
        button.classList.add("active");

    });

});


// بارگذاری حالت ذخیره‌شده
const savedTheme =
    localStorage.getItem("mathmateTheme") || "light";


// اعمال حالت
changeTheme(savedTheme);


// فعال کردن دکمه درست
themeOptions.forEach(button => {

    if (button.dataset.theme === savedTheme) {

        button.classList.add("active");

    } else {

        button.classList.remove("active");

    }

});


// ================= DEVICE INFORMATION =================


// ---------- سیستم عامل ----------

const osInfo =
    document.getElementById("osInfo");

let operatingSystem = "نامشخص";

const userAgent =
    navigator.userAgent;


if (userAgent.includes("Windows")) {

    operatingSystem = "Windows";

} else if (userAgent.includes("Android")) {

    operatingSystem = "Android";

} else if (
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
) {

    operatingSystem = "iOS";

} else if (userAgent.includes("Mac OS")) {

    operatingSystem = "macOS";

} else if (userAgent.includes("Linux")) {

    operatingSystem = "Linux";

}


// نمایش سیستم عامل
if (osInfo) {

    osInfo.textContent =
        operatingSystem;

}


// ---------- معماری سیستم ----------

const architectureInfo =
    document.getElementById("architectureInfo");

let architecture =
    "نامشخص";


if (
    userAgent.includes("Win64") ||
    userAgent.includes("x64") ||
    userAgent.includes("x86_64")
) {

    architecture = "64-bit";

} else if (
    userAgent.includes("WOW64") ||
    userAgent.includes("x86")
) {

    architecture = "32-bit";

}


// نمایش معماری
if (architectureInfo) {

    architectureInfo.textContent =
        architecture;

}


// ---------- مرورگر ----------

const browserInfo =
    document.getElementById("browserInfo");

let browser =
    "نامشخص";


if (userAgent.includes("Firefox")) {

    browser = "Firefox";

} else if (userAgent.includes("Edg")) {

    browser = "Microsoft Edge";

} else if (
    userAgent.includes("Chrome") &&
    !userAgent.includes("Edg")
) {

    browser = "Google Chrome";

} else if (
    userAgent.includes("Safari") &&
    !userAgent.includes("Chrome")
) {

    browser = "Safari";

}


// نمایش مرورگر
if (browserInfo) {

    browserInfo.textContent =
        browser;

}



// ================= تبدیل تاریخ =================

const dateCalendarOptions =
    document.querySelectorAll(".date-calendar-option");

const dateYear =
    document.getElementById("dateYear");

const dateMonth =
    document.getElementById("dateMonth");

const dateDay =
    document.getElementById("dateDay");

const calculateDate =
    document.getElementById("calculateDate");

const jalaliResult =
    document.getElementById("jalaliResult");

const gregorianResult =
    document.getElementById("gregorianResult");

const hijriResult =
    document.getElementById("hijriResult");

const dateResult =
    document.getElementById("dateResult");


let selectedCalendar = "jalali";


// ================= انتخاب تقویم =================

dateCalendarOptions.forEach(button => {

    button.addEventListener("click", () => {

        dateCalendarOptions.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCalendar =
            button.dataset.calendar;

        console.log(
            "تقویم انتخاب شده:",
            selectedCalendar
        );

    });

});


// ================= تبدیل شمسی به میلادی =================

function jalaliToGregorian(jy, jm, jd) {

    let gy;

    if (jy > 979) {
        gy = 1600;
        jy -= 979;
    } else {
        gy = 621;
    }

    let days =
        (365 * jy) +
        Math.floor(jy / 33) * 8 +
        Math.floor(((jy % 33) + 3) / 4) +
        78 +
        jd +
        (jm < 7
            ? (jm - 1) * 31
            : ((jm - 7) * 30) + 186);

    gy +=
        400 *
        Math.floor(days / 146097);

    days %= 146097;

    if (days > 36524) {

        gy +=
            100 *
            Math.floor(--days / 36524);

        days %= 36524;

        if (days >= 365) {
            days++;
        }
    }

    gy +=
        4 *
        Math.floor(days / 1461);

    days %= 1461;

    if (days > 365) {

        gy +=
            Math.floor((days - 1) / 365);

        days =
            (days - 1) % 365;
    }

    let gd = days + 1;

    const monthDays = [
        31,
        28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ];

    const leap =
        (gy % 4 === 0 && gy % 100 !== 0) ||
        (gy % 400 === 0);

    if (leap) {
        monthDays[1] = 29;
    }

    let gm = 0;

    while (
        gm < 12 &&
        gd > monthDays[gm]
    ) {

        gd -= monthDays[gm];
        gm++;
    }

    return {
        year: gy,
        month: gm + 1,
        day: gd
    };
}


// ================= تبدیل میلادی به شمسی =================

function gregorianToJalali(gy, gm, gd) {

    const gDaysInMonth = [
        31,
        28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ];

    const jDaysInMonth = [
        31,
        31,
        31,
        31,
        31,
        31,
        30,
        30,
        30,
        30,
        30,
        29
    ];

    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    let gd2 = gd - 1;

    let days =
        365 * gy2 +
        Math.floor((gy2 + 3) / 4) -
        Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400);

    for (let i = 0; i < gm2; i++) {
        days += gDaysInMonth[i];
    }

    if (
        gm2 > 1 &&
        (
            (gy % 4 === 0 && gy % 100 !== 0) ||
            (gy % 400 === 0)
        )
    ) {
        days++;
    }

    days += gd2;

    let jy =
        979 +
        33 * Math.floor(days / 12053);

    days %= 12053;

    jy +=
        4 * Math.floor(days / 1461);

    days %= 1461;

    if (days > 365) {

        jy +=
            Math.floor((days - 1) / 365);

        days =
            (days - 1) % 365;
    }

    let jm = 0;

    while (
        jm < 11 &&
        days >= jDaysInMonth[jm]
    ) {

        days -= jDaysInMonth[jm];
        jm++;
    }

    let jd = days + 1;

    return {
        year: jy,
        month: jm + 1,
        day: jd
    };
}


// ================= تبدیل میلادی به قمری =================

function gregorianToHijri(date) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-US-u-ca-islamic",
            {
                year: "numeric",
                month: "numeric",
                day: "numeric"
            }
        );

    const parts =
        formatter.formatToParts(date);

    let year;
    let month;
    let day;

    parts.forEach(part => {

        if (part.type === "year") {
            year = Number(part.value);
        }

        if (part.type === "month") {
            month = Number(part.value);
        }

        if (part.type === "day") {
            day = Number(part.value);
        }

    });

    return {
        year,
        month,
        day
    };
}


// ================= تبدیل قمری به میلادی =================

function hijriToGregorian(hy, hm, hd) {

    const epoch =
        new Date(Date.UTC(622, 6, 19));

    const days =
        Math.floor(
            (11 * hy + 3) / 30
        ) +
        354 * (hy - 1) +
        30 * (hm - 1) -
        Math.floor((hm - 1) / 2) +
        hd -
        1;

    const result =
        new Date(
            epoch.getTime() +
            days * 86400000
        );

    return {
        year: result.getUTCFullYear(),
        month: result.getUTCMonth() + 1,
        day: result.getUTCDate()
    };
}


// ================= اعتبارسنجی تاریخ =================

function isValidDate(year, month, day) {

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        return false;
    }

    if (
        month < 1 ||
        month > 12 ||
        day < 1
    ) {
        return false;
    }

    return true;
}


// ================= دکمه تبدیل =================

if (calculateDate) {

    calculateDate.addEventListener("click", () => {

        const year =
            Number(dateYear.value);

        const month =
            Number(dateMonth.value);

        const day =
            Number(dateDay.value);


        // بررسی خالی نبودن ورودی‌ها

        if (
            !dateYear.value ||
            !dateMonth.value ||
            !dateDay.value
        ) {

            alert(
                "لطفاً سال، ماه و روز را کامل وارد کن 🙂"
            );

            return;
        }


        // بررسی معتبر بودن عددها

        if (
            !isValidDate(
                year,
                month,
                day
            )
        ) {

            alert(
                "تاریخ واردشده معتبر نیست 🙂"
            );

            return;
        }


        let jalali;
        let gregorian;
        let hijri;


        // ================= شمسی =================

        if (
            selectedCalendar === "jalali"
        ) {

            jalali = {
                year,
                month,
                day
            };

            gregorian =
                jalaliToGregorian(
                    year,
                    month,
                    day
                );

            hijri =
                gregorianToHijri(
                    new Date(
                        gregorian.year,
                        gregorian.month - 1,
                        gregorian.day
                    )
                );
        }


        // ================= میلادی =================

        else if (
            selectedCalendar === "gregorian"
        ) {

            gregorian = {
                year,
                month,
                day
            };

            jalali =
                gregorianToJalali(
                    year,
                    month,
                    day
                );

            hijri =
                gregorianToHijri(
                    new Date(
                        year,
                        month - 1,
                        day
                    )
                );
        }


        // ================= قمری =================

        else if (
            selectedCalendar === "hijri"
        ) {

            hijri = {
                year,
                month,
                day
            };

            gregorian =
                hijriToGregorian(
                    year,
                    month,
                    day
                );

            jalali =
                gregorianToJalali(
                    gregorian.year,
                    gregorian.month,
                    gregorian.day
                );
        }


        // ================= نمایش نتیجه =================

        if (jalaliResult) {

            jalaliResult.textContent =
                `${jalali.year}/${jalali.month}/${jalali.day}`;
        }

        if (gregorianResult) {

            gregorianResult.textContent =
                `${gregorian.year}/${gregorian.month}/${gregorian.day}`;
        }

        if (hijriResult) {

            hijriResult.textContent =
                `${hijri.year}/${hijri.month}/${hijri.day}`;
        }


        // نمایش کارت نتیجه

        if (dateResult) {

            dateResult.classList.add("show");
        }

    });

}


// ===============================
// UNIT CONVERTER PAGE
// ===============================

const toolsUnit = document.getElementById("toolsUnit");
const unitPage = document.getElementById("unitPage");
const unitBack = document.getElementById("unitBack");


// ===============================
// باز کردن صفحه تبدیل واحد
// ===============================

if (toolsUnit) {

    toolsUnit.addEventListener("click", () => {

        currentPage = "tools";

        // مخفی کردن همه صفحات
        hideAllPages();

        // مخفی کردن صفحه ابزارها
        closeToolsPage();

        // نمایش صفحه تبدیل واحد
        unitPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// بازگشت از صفحه تبدیل واحد
// ===============================

if (unitBack) {

    unitBack.addEventListener("click", () => {

        // مخفی کردن صفحه تبدیل واحد
        unitPage.classList.remove("show");

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// UNIT CONVERTER LOGIC
// ===============================

const unitValue =
    document.getElementById("unitValue");

const unitFrom =
    document.getElementById("unitFrom");

const unitTo =
    document.getElementById("unitTo");

const calculateUnit =
    document.getElementById("calculateUnit");

const unitResult =
    document.getElementById("unitResult");

const unitResultValue =
    document.getElementById("unitResultValue");

const unitTypes =
    document.querySelectorAll(".unit-type");


// ===============================
// واحدها و ضرایب تبدیل
// ===============================

const conversionRates = {

    // طول
    length: {

        meter: 1,

        kilometer: 1000,

        centimeter: 0.01,

        millimeter: 0.001

    },


    // وزن
    weight: {

        kilogram: 1,

        gram: 0.001,

        milligram: 0.000001,

        ton: 1000

    },


    // حجم
    volume: {

        liter: 1,

        milliliter: 0.001,

        cubicMeter: 1000

    },


    // دما
    temperature: {

        celsius: 1,

        fahrenheit: 1,

        kelvin: 1

    }

};


// ===============================
// نام فارسی واحدها
// ===============================

const unitNames = {

    // طول
    length: {

        meter: "متر",

        kilometer: "کیلومتر",

        centimeter: "سانتی‌متر",

        millimeter: "میلی‌متر"

    },


    // وزن
    weight: {

        kilogram: "کیلوگرم",

        gram: "گرم",

        milligram: "میلی‌گرم",

        ton: "تن"

    },


    // حجم
    volume: {

        liter: "لیتر",

        milliliter: "میلی‌لیتر",

        cubicMeter: "متر مکعب"

    },


    // دما
    temperature: {

        celsius: "سلسیوس",

        fahrenheit: "فارنهایت",

        kelvin: "کلوین"

    }

};


// ===============================
// نوع واحد فعلی
// ===============================

let currentUnitType = "length";


// ===============================
// ساخت گزینه‌های Select
// ===============================

function updateUnitOptions() {

    // پاک کردن گزینه‌های قبلی
    unitFrom.innerHTML = "";
    unitTo.innerHTML = "";


    // گرفتن واحدهای مربوط به نوع انتخاب‌شده
    const units =
        conversionRates[currentUnitType];


    // ساخت گزینه‌ها
    Object.keys(units).forEach(unit => {

        // ---------------------------
        // Select مبدا
        // ---------------------------

        const optionFrom =
            document.createElement("option");

        optionFrom.value = unit;

        optionFrom.textContent =
            unitNames[currentUnitType][unit];

        unitFrom.appendChild(optionFrom);


        // ---------------------------
        // Select مقصد
        // ---------------------------

        const optionTo =
            document.createElement("option");

        optionTo.value = unit;

        optionTo.textContent =
            unitNames[currentUnitType][unit];

        unitTo.appendChild(optionTo);

    });


    // ---------------------------
    // انتخاب پیش‌فرض
    // ---------------------------

    if (unitFrom.options.length > 0) {

        unitFrom.selectedIndex = 0;

    }


    if (unitTo.options.length > 1) {

        unitTo.selectedIndex = 1;

    }


    else if (unitTo.options.length > 0) {

        unitTo.selectedIndex = 0;

    }

}


// ===============================
// نمایش نتیجه
// ===============================

function showUnitResult(result) {

    // نمایش عدد
    unitResultValue.textContent =
        result.toLocaleString("fa-IR", {
            maximumFractionDigits: 10
        });


    // نمایش کارت نتیجه
    unitResult.classList.add("show");

}


// ===============================
// تغییر نوع واحد
// ===============================

unitTypes.forEach(button => {

    button.addEventListener("click", () => {


        // حذف active از همه
        unitTypes.forEach(btn => {

            btn.classList.remove("active");

        });


        // فعال کردن گزینه انتخاب‌شده
        button.classList.add("active");


        // ذخیره نوع واحد
        currentUnitType =
            button.dataset.unit;


        // ساخت دوباره Selectها
        updateUnitOptions();


        // پاک کردن ورودی
        unitValue.value = "";


        // پاک کردن نتیجه
        unitResultValue.textContent = "0";


        // مخفی کردن نتیجه قبلی
        unitResult.classList.remove("show");

    });

});


// ===============================
// دکمه تبدیل
// ===============================

if (calculateUnit) {

    calculateUnit.addEventListener("click", () => {


        // گرفتن مقدار
        const value =
            Number(unitValue.value);


        // ---------------------------
        // بررسی ورودی
        // ---------------------------

        if (
            unitValue.value.trim() === "" ||
            !Number.isFinite(value)
        ) {

            alert(
                "لطفاً یک عدد معتبر وارد کن 🙂"
            );

            return;

        }


        // گرفتن واحد مبدا و مقصد
        const from =
            unitFrom.value;

        const to =
            unitTo.value;


        // ===============================
        // تبدیل دما
        // ===============================

        if (
            currentUnitType === "temperature"
        ) {


            let celsius;


            // ---------------------------
            // مبدا → سلسیوس
            // ---------------------------

            if (from === "celsius") {

                celsius = value;

            }

            else if (from === "fahrenheit") {

                celsius =
                    (value - 32) * 5 / 9;

            }

            else if (from === "kelvin") {

                celsius =
                    value - 273.15;

            }


            // ---------------------------
            // سلسیوس → مقصد
            // ---------------------------

            let result;


            if (to === "celsius") {

                result = celsius;

            }

            else if (to === "fahrenheit") {

                result =
                    (celsius * 9 / 5) + 32;

            }

            else if (to === "kelvin") {

                result =
                    celsius + 273.15;

            }


            // نمایش نتیجه
            showUnitResult(result);

            return;

        }


        // ===============================
        // تبدیل واحدهای معمولی
        // ===============================


        const fromRate =
            conversionRates[currentUnitType][from];


        const toRate =
            conversionRates[currentUnitType][to];


        // تبدیل مقدار به واحد پایه
        const baseValue =
            value * fromRate;


        // تبدیل واحد پایه به مقصد
        const result =
            baseValue / toRate;


        // نمایش نتیجه
        showUnitResult(result);

    });

}


// ===============================
// اجرای اولیه
// ===============================

updateUnitOptions();

// ================= PERCENTAGE PAGE =================

const toolsPercentage = document.getElementById("toolsPercentage");
const percentagePage = document.getElementById("percentagePage");
const percentageBack = document.getElementById("percentageBack");


// ===============================
// باز کردن صفحه محاسبه درصد
// ===============================

toolsPercentage.addEventListener("click", () => {

    currentPage = "tools";

    // مخفی کردن همه صفحات
    hideAllPages();

    // مخفی کردن صفحه ابزارها
    closeToolsPage();

    // نمایش صفحه محاسبه درصد
    percentagePage.classList.add("show");

    // رفتن به بالای صفحه
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ===============================
// بازگشت از صفحه درصد
// ===============================

percentageBack.addEventListener("click", () => {

    percentagePage.classList.remove("show");

    // برگشت به صفحه ابزارها
    toolsPage.classList.add("show");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ===============================
// عناصر محاسبه درصد
// ===============================

const percentageValue =
    document.getElementById("percentageValue");

const percentageNumber =
    document.getElementById("percentageNumber");

const calculatePercentage =
    document.getElementById("calculatePercentage");

const percentageResult =
    document.getElementById("percentageResult");

const percentageResultValue =
    document.getElementById("percentageResultValue");


// ===============================
// محاسبه درصد
// ===============================

calculatePercentage.addEventListener("click", () => {

    const percentage =
        Number(percentageValue.value);

    const number =
        Number(percentageNumber.value);


    // بررسی ورودی‌ها
    if (
        percentageValue.value.trim() === "" ||
        percentageNumber.value.trim() === "" ||
        !Number.isFinite(percentage) ||
        !Number.isFinite(number)
    ) {

        alert("لطفاً درصد و عدد را به‌درستی وارد کن 🙂");

        return;
    }


    // محاسبه درصد
    // مثال:
    // 20 درصد از 500
    // 20 ÷ 100 × 500 = 100

    const result =
        (percentage / 100) * number;


    // نمایش نتیجه
    percentageResultValue.textContent =
        result.toLocaleString("fa-IR", {
            maximumFractionDigits: 10
        });

});

/* ================= TIME PAGE ================= */

const toolsTime = document.getElementById("toolsTime");
const timePage = document.getElementById("timePage");
const timeBack = document.getElementById("timeBack");



// ===============================
// باز کردن صفحه تبدیل زمان
// ===============================

if (toolsTime) {

    toolsTime.addEventListener("click", () => {

        currentPage = "tools";

        // مخفی کردن تمام صفحات
        hideAllPages();

        // مخفی کردن صفحه ابزارها
        closeToolsPage();

        // نمایش صفحه تبدیل زمان
        timePage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// ===============================
// بازگشت از صفحه تبدیل زمان
// ===============================

if (timeBack) {

    timeBack.addEventListener("click", () => {

        // مخفی کردن صفحه زمان
        timePage.classList.remove("show");

        // نمایش صفحه ابزارها
        toolsPage.classList.add("show");

        // رفتن به بالای صفحه
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


/* ================= TIME CONVERTER ================= */

// ورودی مقدار
const timeValue =
    document.getElementById("timeValue");

// واحد مبدا
const timeFrom =
    document.getElementById("timeFrom");

// واحد مقصد
const timeTo =
    document.getElementById("timeTo");

// دکمه تبدیل
const calculateTimeBtn =
    document.getElementById("calculateTimeBtn");

// کارت نتیجه
const timeResult =
    document.getElementById("timeResult");

// مقدار نتیجه
const timeResultValue =
    document.getElementById("timeResultValue");


// ===============================
// ضریب تبدیل واحدهای زمان
// ===============================

const timeConversionRates = {

    second: 1,

    minute: 60,

    hour: 60 * 60,

    day: 24 * 60 * 60

};


// ===============================
// نام فارسی واحدهای زمان
// ===============================

const timeUnitNames = {

    second: "ثانیه",

    minute: "دقیقه",

    hour: "ساعت",

    day: "روز"

};


// ===============================
// تبدیل زمان
// ===============================

if (calculateTimeBtn) {

    calculateTimeBtn.addEventListener("click", () => {

        // گرفتن مقدار واردشده
        const value =
            Number(timeValue.value);


        // ===============================
        // بررسی ورودی
        // ===============================

        if (
            timeValue.value.trim() === "" ||
            !Number.isFinite(value)
        ) {

            alert(
                "لطفاً یک مقدار معتبر وارد کن 🙂"
            );

            timeResult.classList.remove("show");

            return;
        }


        // ===============================
        // واحد مبدا و مقصد
        // ===============================

        const from =
            timeFrom.value;

        const to =
            timeTo.value;


        // ===============================
        // تبدیل مقدار به ثانیه
        // ===============================

        const seconds =
            value * timeConversionRates[from];


        // ===============================
        // تبدیل ثانیه به واحد مقصد
        // ===============================

        const result =
            seconds / timeConversionRates[to];


        // ===============================
        // حذف اعشارهای اضافی
        // ===============================

        const cleanResult =
            Number(result.toFixed(10));


        // ===============================
        // نمایش نتیجه
        // ===============================

        timeResultValue.textContent =
            `${cleanResult.toLocaleString("fa-IR")} ${timeUnitNames[to]}`;


        // نمایش کارت نتیجه
        timeResult.classList.add("show");

    });

}