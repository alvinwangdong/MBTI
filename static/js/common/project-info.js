$(document).ready(function () {
    // 这个脚本被多个页面复用，用于在控制台输出统一的项目信息。
    var license = "MIT License";
    var github = "https://github.com/MskTmi/MBTI";
    var disclaimer = "This project is for learning and reference only, and does not bear any responsibility.";
    console.group("Project Information");

    console.log("%cThis project is licensed under the " + license, "color: darkorange; font-size: 20px;");
    console.log("%cThe source code for this project is hosted on " + github, "color: darkorange; font-size: 20px;");
    console.log("%cDisclaimer: " + disclaimer, "color: darkorange; font-size: 20px;");

    console.groupEnd();
})