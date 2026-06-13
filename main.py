# import flet as ft
# import math
# import urllib.parse
# import webbrowser



# def main(page: ft.Page):
#     page.title = "نرم‌افزار ریاضی"
#     page.scroll = ft.ScrollMode.AUTO
#     page.window_width = 380
#     page.window_height = 720
#     page.padding = 20

#     def clear():
#         page.controls.clear()

#     def back():
#         return ft.ElevatedButton(
#             "⬅ بازگشت",
#             width=320,
#             height=50,
#             on_click=lambda e: menu()
#         )

#     # ---------- دکمه موبایلی ----------
#     def mobile_button(text, action):
#         return ft.ElevatedButton(
#             text,
#             width=320,
#             height=55,
#             on_click=action
#         )

#     # -----------------شب و روز ----------------
#     def toggle_theme(e):
#         if page.theme_mode == ft.ThemeMode.LIGHT:
#             page.theme_mode = ft.ThemeMode.DARK
#         else:
#             page.theme_mode = ft.ThemeMode.LIGHT
#         page.update()

#     # ---------------- منو ----------------
#     def menu():
#         clear()
#         page.add(
#             ft.Text("📱 منوی اصلی", size=24, weight="bold"),
#             mobile_button("🧮 ماشین حساب", lambda e: calculator()),
#             mobile_button("📐 مساحت و محیط", lambda e: geometry()),
#             mobile_button("➗ ب.م.م / ک.م.م", lambda e: gcd_lcm()),
#             mobile_button("🔢 شمارنده‌ها و مضرب‌ها", lambda e: dm_menu()),
#             mobile_button("🔁 تبدیل واحد", lambda e: unit_convert()),
#             mobile_button("🎥 آموزش آنلاین", lambda e: online()),
#             mobile_button("ℹ درباره ما", lambda e: about()),
#             mobile_button("🌙 / ☀ تغییر تم", toggle_theme),
#         )
#         page.update()

#     # ---------------- ماشین حساب ----------------
#     def calculator():
#         clear()
#         display = ft.TextField(
#             text_align="left",
#             read_only=True,
#             text_size=24,
#             height=70,
#             border_radius=10
#         )

#         def press(v):
#             display.value += v
#             page.update()

#         def equal(e):
#             try:
#                 display.value = str(eval(display.value))
#             except:
#                 display.value = "خطا"
#             page.update()

#         def row(btns):
#             return ft.Row(
#                 [ft.ElevatedButton(b, width=80, height=60, on_click=lambda e, x=b: press(x)) for b in btns],
#                 alignment="center"
#             )

#         page.add(
#             ft.Text("ماشین حساب", size=20),
#             display,
#             row(["7", "8", "9", "/"]),
#             row(["4", "5", "6", "*"]),
#             row(["1", "2", "3", "-"]),
#             ft.Row(
#                 [
#                     ft.ElevatedButton("0", width=80, height=60, on_click=lambda e: press("0")),
#                     ft.ElevatedButton(".", width=80, height=60, on_click=lambda e: press(".")),
#                     ft.ElevatedButton("=", width=80, height=60, on_click=equal),
#                     ft.ElevatedButton("+", width=80, height=60, on_click=lambda e: press("+")),
#                 ],
#                 alignment="center"
#             ),
#             ft.ElevatedButton("پاک کردن", on_click=lambda e: setattr(display, "value", "") or page.update()),
#             back()
#         )

#     # ---------------- مساحت و محیط ----------------
#     def geometry():
#         clear()

#         result_text = ft.Text("", size=18, weight=ft.FontWeight.BOLD, text_align=ft.TextAlign.CENTER)

#         # --- کنترل‌های اصلی ---
#         shape_dropdown = ft.Dropdown(
#             label="شکل هندسی",
#             width=320,
#             options=[
#                 ft.dropdown.Option("دایره"),
#                 ft.dropdown.Option("مربع"),
#                 ft.dropdown.Option("مستطیل"),
#                 ft.dropdown.Option("مثلث متساوی‌الاضلاع"),
#                 ft.dropdown.Option("مثلث معمولی"),
#                 ft.dropdown.Option("ذوزنقه"),
#                 ft.dropdown.Option("متوازی‌الاضلاع"),
#             ],
#             value="دایره"
#         )

#         calc_type = ft.RadioGroup(
#             value="area",
#             content=ft.Column([
#                 ft.Radio(value="area", label="مساحت"),
#                 ft.Radio(value="perimeter", label="محیط"),
#             ])
#         )

#         # فیلدهای ورودی - همیشه در DOM وجود دارند، اما وضعیت visible آن‌ها کنترل می‌شود
#         input_a = ft.TextField(label="ورودی ۱", width=320, visible=True)
#         input_b = ft.TextField(label="ورودی ۲", width=320, visible=False)
#         input_c = ft.TextField(label="ورودی ۳", width=320, visible=False)

#         def update_ui_based_on_shape(e=None):
#             shape = shape_dropdown.value
#             calc = calc_type.value

#             # 1. پاکسازی و پنهان‌سازی پیش‌فرض
#             input_a.visible, input_b.visible, input_c.visible = False, False, False
#             input_a.value, input_b.value, input_c.value = "", "", ""
#             result_text.value = ""

#             # 2. تنظیم UI بر اساس شکل (تمرکز بر نمایش فوری فیلدهای لازم)
#             if shape == "دایره":
#                 input_a.label = "شعاع (r)"
#                 input_a.visible = True

#             elif shape == "مربع":
#                 input_a.label = "ضلع (a)"
#                 input_a.visible = True

#             elif shape == "مستطیل":
#                 input_a.label = "طول (L)"
#                 input_b.label = "عرض (W)"
#                 # ⚡️ رفع مشکل: مستطیل همیشه به 2 ورودی نیاز دارد، فوراً هر دو را نمایش می‌دهیم.
#                 input_a.visible, input_b.visible = True, True

#             elif shape == "مثلث متساوی‌الاضلاع":
#                 input_a.label = "ضلع (a)"
#                 input_a.visible = True

#             elif shape == "مثلث معمولی":
#                 # لیبل‌ها باید بر اساس calc_type تغییر کنند، اما نمایش فیلدها ثابت بماند.
#                 if calc == "area":
#                     input_a.label = "قاعده (b)"
#                     input_b.label = "ارتفاع (h)"
#                 else:  # perimeter
#                     input_a.label = "ضلع ۱"
#                     input_b.label = "ضلع ۲"
#                     input_c.label = "ضلع ۳"

#                 # ⚡️ نمایش 3 فیلد برای مثلث معمولی (برای محیط 3 ضلع لازم است، برای مساحت 2)
#                 # ما به کاربر اجازه می‌دهیم که در صورت نیاز به محیط، ورودی 3 را وارد کند.
#                 input_a.visible, input_b.visible = True, True
#                 if calc == "perimeter":
#                     input_c.visible = True


#             elif shape == "ذوزنقه":
#                 if calc == "area":
#                     input_a.label = "قاعده ۱ (b1)"
#                     input_b.label = "قاعده ۲ (b2)"
#                     input_c.label = "ارتفاع (h)"
#                 else:  # محیط
#                     input_a.label = "قاعده ۱ (b1)"
#                     input_b.label = "قاعده ۲ (b2)"
#                     input_c.label = "ساق (s)"

#                     # ⚡️ ذوزنقه همیشه 3 ورودی مورد نیاز دارد (حتی اگر فرمول محیطی به 4 ضلع نیاز داشته باشد، ما با 3 پارامتر اساسی کار می‌کنیم).
#                 input_a.visible, input_b.visible, input_c.visible = True, True, True


#             elif shape == "متوازی‌الاضلاع":
#                 input_a.label = "قاعده (b)"
#                 input_b.label = "ارتفاع (h)"
#                 # ⚡️ فوراً هر دو ورودی را نمایش می‌دهیم
#                 input_a.visible, input_b.visible = True, True

#             page.update()

#         # --- ترکیب کننده‌ها (Event Handlers) ---
#         # ⚡️ اصلاح شده: فقط تغییر شکل مسئول تنظیم فیلدهای قابل مشاهده است
#         shape_dropdown.on_change = update_ui_based_on_shape

#         # تغییر نوع محاسبه فقط برای به‌روزرسانی لیبل‌ها (مثلث و ذوزنقه) و فرمول نهایی لازم است.
#         calc_type.on_change = lambda e: (update_ui_based_on_shape(e), page.update())

#         # تابع اصلی محاسبه (بدون تغییر عمده در منطق محاسباتی)
#         def calculate(e):
#             try:
#                 val_a = float(input_a.value) if input_a.visible and input_a.value else None
#                 val_b = float(input_b.value) if input_b.visible and input_b.value else None
#                 val_c = float(input_c.value) if input_c.visible and input_c.value else None

#                 shape = shape_dropdown.value
#                 calc = calc_type.value
#                 res = ""

#                 # --- منطق محاسبه (بدون تغییرات عمده در محاسبات) ---
#                 if shape == "دایره":
#                     if val_a is None: raise ValueError("شعاع (A) مورد نیاز است.")
#                     res = f"محیط = {2 * math.pi * val_a:.2f}" if calc == "perimeter" else f"مساحت = {math.pi * val_a ** 2:.2f}"

#                 elif shape == "مربع":
#                     if val_a is None: raise ValueError("ضلع (A) مورد نیاز است.")
#                     res = f"محیط = {4 * val_a:.2f}" if calc == "perimeter" else f"مساحت = {val_a ** 2:.2f}"

#                 elif shape == "مستطیل":
#                     if val_a is None or val_b is None: raise ValueError("برای مستطیل به طول (A) و عرض (B) نیاز است.")
#                     res = f"محیط = {2 * (val_a + val_b):.2f}" if calc == "perimeter" else f"مساحت = {val_a * val_b:.2f}"

#                 elif shape == "مثلث متساوی‌الاضلاع":
#                     if val_a is None: raise ValueError("ضلع (A) مورد نیاز است.")
#                     res = f"محیط = {3 * val_a:.2f}" if calc == "perimeter" else f"مساحت = {(math.sqrt(3) / 4) * val_a ** 2:.2f}"

#                 elif shape == "مثلث معمولی":
#                     if calc == "area":
#                         if val_a is None or val_b is None: raise ValueError(
#                             "برای مساحت مثلث به قاعده (A) و ارتفاع (B) نیاز است.")
#                         res = f"مساحت = {0.5 * val_a * val_b:.2f}"
#                     else:  # perimeter
#                         if val_a is None or val_b is None or val_c is None:
#                             raise ValueError("برای محیط مثلث به سه ضلع (A, B, C) نیاز است.")
#                         res = f"محیط = {val_a + val_b + val_c:.2f}"

#                 elif shape == "ذوزنقه":
#                     if calc == "area":
#                         if val_a is None or val_b is None or val_c is None: raise ValueError(
#                             "برای مساحت ذوزنقه به دو قاعده (A, B) و ارتفاع (C) نیاز است.")
#                         res = f"مساحت = {0.5 * (val_a + val_b) * val_c:.2f}"
#                     else:  # محیط
#                         if val_a is None or val_b is None or val_c is None:
#                             raise ValueError("برای محیط ذوزنقه به دو قاعده (A, B) و ساق (C) نیاز است.")
#                         res = f"محیط = {val_a + val_b + 2 * val_c:.2f}"  # فرض برابری دو ساق

#                 elif shape == "متوازی‌الاضلاع":
#                     if val_a is None or val_b is None: raise ValueError(
#                         "برای متوازی‌الاضلاع به قاعده (A) و ارتفاع (B) نیاز است.")
#                     res = f"محیط = {2 * (val_a + val_b):.2f}" if calc == "perimeter" else f"مساحت = {val_a * val_b:.2f}"

#                 result_text.value = res
#                 page.update()

#             except ValueError as ve:
#                 result_text.value = f"❌ ورودی نامعتبر: {ve}"
#                 page.update()
#             except Exception as ex:
#                 result_text.value = f"❌ خطا در محاسبه: {ex}"
#                 page.update()

#         # --- ساخت صفحه ---
#         page.add(
#             ft.Text("مساحت و محیط اشکال", size=22, weight=ft.FontWeight.BOLD),
#             shape_dropdown,
#             calc_type,
#             input_a,
#             input_b,
#             input_c,
#             ft.Button("محاسبه", width=320, height=48, on_click=calculate),
#             result_text,
#             back()
#         )

#         # ⚡️ تنظیم اولیه UI برای اطمینان از نمایش درست پس از بارگذاری
#         update_ui_based_on_shape()
#     # ---------------- ب.م.م / ک.م.م ----------------
#     def gcd_lcm():
#         clear()
#         a = ft.TextField(label="عدد اول")
#         b = ft.TextField(label="عدد دوم")
#         choice = ft.RadioGroup(
#             value="gcd",
#             content=ft.Column([
#                 ft.Radio(value="gcd", label="ب.م.م"),
#                 ft.Radio(value="lcm", label="ک.م.م"),
#             ])
#         )
#         res = ft.Text()

#         def calc(e):
#             x, y = int(a.value), int(b.value)
#             if choice.value == "gcd":
#                 res.value = f"ب.م.م = {math.gcd(x, y)}"
#             else:
#                 res.value = f"ک.م.م = {(x*y)//math.gcd(x,y)}"
#             page.update()

#         page.add(ft.Text("ب.م.م / ک.م.م", size=20), a, b, choice,
#                  ft.ElevatedButton("محاسبه", on_click=calc), res, back())

#     # ---------------- تبدیل واحد ----------------
#     def unit_convert():
#         clear()
#         value = ft.TextField(label="عدد")
#         unit = ft.Dropdown(
#             label="تبدیل",
#             options=[
#                 ft.dropdown.Option("mm→cm"),
#                 ft.dropdown.Option("cm→mm"),
#                 ft.dropdown.Option("cm→m"),
#                 ft.dropdown.Option("m→cm"),
#                 ft.dropdown.Option("m→km"),
#                 ft.dropdown.Option("km→m"),
#                 ft.dropdown.Option("m³→liter"),
#                 ft.dropdown.Option("liter→m³"),
#             ]
#         )
#         res = ft.Text()

#         def calc(e):
#             x = float(value.value)
#             table = {
#                 "mm→cm": x/10,
#                 "cm→mm": x*10,
#                 "cm→m": x/100,
#                 "m→cm": x*100,
#                 "m→km": x/1000,
#                 "km→m": x*1000,
#                 "m³→liter": x*1000,
#                 "liter→m³": x/1000,
#             }
#             res.value = str(table[unit.value])
#             page.update()

#         page.add(ft.Text("تبدیل واحد", size=20), value, unit, ft.ElevatedButton("تبدیل", on_click=calc), res, back())

#     # ---------------- آموزش آنلاین (جستجو) ----------------

#     def online():
#         clear()
#         query = ft.TextField(label="چی می‌خوای یاد بگیری؟")

#         def search(site):
#             if not query.value:
#                 return

#             q = urllib.parse.quote_plus(query.value)

#             if site == "aparat":
#                 url = f"https://www.aparat.com/search/{q}"
#             else:
#                 url = f"https://www.youtube.com/results?search_query={q}"

#             webbrowser.open(url)  # 👈 قطعی‌ترین روش

#         page.add(
#             ft.Text("آموزش آنلاین", size=20),
#             query,
#             ft.ElevatedButton("جستجو در آپارات", on_click=lambda e: search("aparat")),
#             ft.ElevatedButton("جستجو در یوتیوب", on_click=lambda e: search("youtube")),
#             back()
#         )

#     # ---------------- درباره ما ----------------

#     def about():
#         clear()
#         page.add(
#             ft.Text("درباره ما", size=30, weight="bold"),
#             ft.Text("طراح و توسعه دهنده: حسین ثقفی\nنرم‌افزار ریاضی چند منظوره با امکانات آموزشی و محاسباتی"),
#             back()
#         )

#     # ---------------- زیرمنوی شمارنده / مضرب ----------------
#     def dm_menu():
#         clear()
#         page.add(
#             ft.Text("🔢 انتخاب عملیات", size=22, weight="bold"),
#             mobile_button("🔢 شمارنده‌ها", lambda e: divisors_page()),
#             mobile_button("🔁 مضرب‌ها", lambda e: multiples_page()),
#             back()
#         )

#     # ---------------- صفحه شمارنده‌ها ----------------
#     def divisors_page():
#         clear()
#         num = ft.TextField(label="عدد مورد نظر", keyboard_type=ft.KeyboardType.NUMBER)
#         result = ft.Text(selectable=True)

#         def calc(e):
#             try:
#                 n = int(num.value)
#                 d = [i for i in range(1, n + 1) if n % i == 0]
#                 result.value = (
#                     f"📌 شمارنده‌ها:\n{d}\n\n"
#                     f"کوچک‌ترین: {min(d)}\n"
#                     f"بزرگ‌ترین: {max(d)}"
#                 )
#                 page.update()
#             except:
#                 result.value = "❌ ورودی نامعتبر"
#                 page.update()

#         page.add(
#             ft.Text("🔢 محاسبه شمارنده‌ها", size=20, weight="bold"),
#             num,
#             ft.ElevatedButton("محاسبه", on_click=calc),
#             result,
#             back()
#         )

#     # ---------------- صفحه مضرب‌ها ----------------
#     def multiples_page():
#         clear()
#         num = ft.TextField(label="عدد مورد نظر", keyboard_type=ft.KeyboardType.NUMBER)
#         count = ft.TextField(label="تعداد مضرب‌ها", keyboard_type=ft.KeyboardType.NUMBER)
#         result = ft.Text(selectable=True)

#         def calc(e):
#             try:
#                 n = int(num.value)
#                 c = int(count.value)
#                 m = [n * i for i in range(1, c + 1)]
#                 result.value = (
#                     f"📌 مضرب‌ها:\n{m}\n\n"
#                     f"کوچک‌ترین: {min(m)}\n"
#                     f"بزرگ‌ترین: {max(m)}"
#                 )
#                 page.update()
#             except:
#                 result.value = "❌ ورودی نامعتبر"
#                 page.update()

#         page.add(
#             ft.Text("🔁 محاسبه مضرب‌ها", size=20, weight="bold"),
#             num,
#             count,
#             ft.ElevatedButton("محاسبه", on_click=calc),
#             result,
#             back()
#         )


#     menu()


# ft.app(target=main)


import flet as ft
import math
import urllib.parse
import webbrowser



def main(page: ft.Page):
    page.title = "MathMate"
    page.scroll = ft.ScrollMode.AUTO
    page.window_width = 380
    page.window_height = 720
    page.padding = 20

    def clear():
        page.controls.clear()

    def back():
        return ft.ElevatedButton(
            "⬅ بازگشت",
            width=320,
            height=50,
            on_click=lambda e: menu()
        )

    # ---------- دکمه موبایلی ----------
    def mobile_button(text, action):
        return ft.ElevatedButton(
            text,
            width=320,
            height=55,
            on_click=action
        )

    # -----------------شب و روز ----------------
    def toggle_theme(e):
        if page.theme_mode == ft.ThemeMode.LIGHT:
            page.theme_mode = ft.ThemeMode.DARK
        else:
            page.theme_mode = ft.ThemeMode.LIGHT
        page.update()

    # ---------------- منو ----------------
    def menu():
        clear()
        page.add(
            ft.Text("📱 منوی اصلی", size=24, weight="bold"),
            mobile_button("🧮 ماشین حساب", lambda e: calculator()),
            mobile_button("📐 مساحت و محیط", lambda e: geometry()),
            mobile_button("➗ ب.م.م / ک.م.م", lambda e: gcd_lcm()),
            mobile_button("🔢 شمارنده‌ها و مضرب‌ها", lambda e: dm_menu()),
            mobile_button("🔍 تشخیص نوع عدد", lambda e: number_type_page()), # 💡 دکمه جدید اضافه شده بدون تغییر بقیه اجزا
            mobile_button("🔁 تبدیل واحد", lambda e: unit_convert()),
            mobile_button("📅 تبدیل تاریخ", lambda e: date_convert_page()),
            mobile_button("🎥 آموزش آنلاین", lambda e: online()),
            mobile_button("ℹ درباره ما", lambda e: about()),
            mobile_button("🌙 / ☀ تغییر تم", toggle_theme),
        )
        page.update()

    # ---------------- ماشین حساب ----------------
    def calculator():
        clear()
        display = ft.TextField(
            text_align="left",
            read_only=True,
            text_size=24,
            height=70,
            border_radius=10
        )

        def press(v):
            display.value += v
            page.update()

        def equal(e):
            try:
                display.value = str(eval(display.value))
            except:
                display.value = "خطا"
            page.update()

        def row(btns):
            return ft.Row(
                [ft.ElevatedButton(b, width=80, height=60, on_click=lambda e, x=b: press(x)) for b in btns],
                alignment="center"
            )

        page.add(
            ft.Text("ماشین حساب", size=20),
            display,
            row(["7", "8", "9", "/"]),
            row(["4", "5", "6", "*"]),
            row(["1", "2", "3", "-"]),
            ft.Row(
                [
                    ft.ElevatedButton("0", width=80, height=60, on_click=lambda e: press("0")),
                    ft.ElevatedButton(".", width=80, height=60, on_click=lambda e: press(".")),
                    ft.ElevatedButton("=", width=80, height=60, on_click=equal),
                    ft.ElevatedButton("+", width=80, height=60, on_click=lambda e: press("+")),
                ],
                alignment="center"
            ),
            ft.ElevatedButton("پاک کردن", on_click=lambda e: setattr(display, "value", "") or page.update()),
            back()
        )

    # ---------------- مساحت و محیط ----------------
    def geometry():
        clear()

        result_text = ft.Text("", size=18, weight=ft.FontWeight.BOLD, text_align=ft.TextAlign.CENTER)

        # --- کنترل‌های اصلی ---
        shape_dropdown = ft.Dropdown(
            label="شکل هندسی",
            width=320,
            options=[
                ft.dropdown.Option("دایره"),
                ft.dropdown.Option("مربع"),
                ft.dropdown.Option("مستطیل"),
                ft.dropdown.Option("مثلث متساوی‌الاضلاع"),
                ft.dropdown.Option("مثلث معمولی"),
                ft.dropdown.Option("ذوزنقه"),
                ft.dropdown.Option("متوازی‌الاضلاع"),
            ],
            value="دایره"
        )

        calc_type = ft.RadioGroup(
            value="area",
            content=ft.Column([
                ft.Radio(value="area", label="مساحت"),
                ft.Radio(value="perimeter", label="محیط"),
            ])
        )

        input_a = ft.TextField(label="ورودی ۱", width=320, visible=True)
        input_b = ft.TextField(label="ورودی ۲", width=320, visible=False)
        input_c = ft.TextField(label="ورودی ۳", width=320, visible=False)

        def update_ui_based_on_shape(e=None):
            shape = shape_dropdown.value
            calc = calc_type.value

            input_a.visible, input_b.visible, input_c.visible = False, False, False
            input_a.value, input_b.value, input_c.value = "", "", ""
            result_text.value = ""

            if shape == "دایره":
                input_a.label = "شعاع (r)"
                input_a.visible = True

            elif shape == "مربع":
                input_a.label = "ضلع (a)"
                input_a.visible = True

            elif shape == "مستطیل":
                input_a.label = "طول (L)"
                input_b.label = "عرض (W)"
                input_a.visible, input_b.visible = True, True

            elif shape == "مثلث متساوی‌الاضلاع":
                input_a.label = "ضلع (a)"
                input_a.visible = True

            elif shape == "مثلث معمولی":
                if calc == "area":
                    input_a.label = "قاعده (b)"
                    input_b.label = "ارتفاع (h)"
                else:  # perimeter
                    input_a.label = "ضلع ۱"
                    input_b.label = "ضلع ۲"
                    input_c.label = "ضلع ۳"

                input_a.visible, input_b.visible = True, True
                if calc == "perimeter":
                    input_c.visible = True


            elif shape == "ذوزنقه":
                if calc == "area":
                    input_a.label = "قاعده ۱ (b1)"
                    input_b.label = "قاعده ۲ (b2)"
                    input_c.label = "ارتفاع (h)"
                else:  # محیط
                    input_a.label = "قاعده ۱ (b1)"
                    input_b.label = "قاعده ۲ (b2)"
                    input_c.label = "ساق (s)"

                input_a.visible, input_b.visible, input_c.visible = True, True, True


            elif shape == "متوازی‌الاضلاع":
                input_a.label = "قاعده (b)"
                input_b.label = "ارتفاع (h)"
                input_a.visible, input_b.visible = True, True

            page.update()

        
        shape_dropdown.on_change = update_ui_based_on_shape

        # تغییر نوع محاسبه فقط برای به‌روزرسانی لیبل‌ها (مثلث و ذوزنقه) و فرمول نهایی لازم است.
        calc_type.on_change = lambda e: (update_ui_based_on_shape(e), page.update())

        # تابع اصلی محاسبه (بدون تغییر عمده در منطق محاسباتی)
        def calculate(e):
            try:
                val_a = float(input_a.value) if input_a.visible and input_a.value else None
                val_b = float(input_b.value) if input_b.visible and input_b.value else None
                val_c = float(input_c.value) if input_c.visible and input_c.value else None

                shape = shape_dropdown.value
                calc = calc_type.value
                res = ""

                # --- منطق محاسبه (بدون تغییرات عمده در محاسبات) ---
                if shape == "دایره":
                    if val_a is None: raise ValueError("شعاع (A) مورد نیاز است.")
                    res = f"محیط = {2 * math.pi * val_a:.2f}" if calc == "perimeter" else f"مساحت = {math.pi * val_a ** 2:.2f}"

                elif shape == "مربع":
                    if val_a is None: raise ValueError("ضلع (A) مورد نیاز است.")
                    res = f"محیط = {4 * val_a:.2f}" if calc == "perimeter" else f"مساحت = {val_a ** 2:.2f}"

                elif shape == "مستطیل":
                    if val_a is None or val_b is None: raise ValueError("برای مستطیل به طول (A) و عرض (B) نیاز است.")
                    res = f"محیط = {2 * (val_a + val_b):.2f}" if calc == "perimeter" else f"مساحت = {val_a * val_b:.2f}"

                elif shape == "مثلث متساوی‌الاضلاع":
                    if val_a is None: raise ValueError("ضلع (A) مورد نیاز است.")
                    res = f"محیط = {3 * val_a:.2f}" if calc == "perimeter" else f"مساحت = {(math.sqrt(3) / 4) * val_a ** 2:.2f}"

                elif shape == "مثلث معمولی":
                    if calc == "area":
                        if val_a is None or val_b is None: raise ValueError(
                            "برای مساحت مثلث به قاعده (A) و ارتفاع (B) نیاز است.")
                        res = f"مساحت = {0.5 * val_a * val_b:.2f}"
                    else:  # perimeter
                        if val_a is None or val_b is None or val_c is None:
                            raise ValueError("برای محیط مثلث به سه ضلع (A, B, C) نیاز است.")
                        res = f"محیط = {val_a + val_b + val_c:.2f}"

                elif shape == "ذوزنقه":
                    if calc == "area":
                        if val_a is None or val_b is None or val_c is None: raise ValueError(
                            "برای مساحت ذوزنقه به دو قاعده (A, B) و ارتفاع (C) نیاز است.")
                        res = f"مساحت = {0.5 * (val_a + val_b) * val_c:.2f}"
                    else:  # محیط
                        if val_a is None or val_b is None or val_c is None:
                            raise ValueError("برای محیط ذوزنقه به دو قاعده (A, B) و ساق (C) نیاز است.")
                        res = f"محیط = {val_a + val_b + 2 * val_c:.2f}" 

                elif shape == "متوازی‌الاضلاع":
                    if val_a is None or val_b is None: raise ValueError(
                        "برای متوازی‌الاضلاع به قاعده (A) و ارتفاع (B) نیاز است.")
                    res = f"محیط = {2 * (val_a + val_b):.2f}" if calc == "perimeter" else f"مساحت = {val_a * val_b:.2f}"

                result_text.value = res
                page.update()

            except ValueError as ve:
                result_text.value = f"❌ ورودی نامعتبر: {ve}"
                page.update()
            except Exception as ex:
                result_text.value = f"❌ خطا در محاسبه: {ex}"
                page.update()

        # --- ساخت صفحه ---
        page.add(
            ft.Text("مساحت و محیط اشکال", size=22, weight=ft.FontWeight.BOLD),
            shape_dropdown,
            calc_type,
            input_a,
            input_b,
            input_c,
            ft.Button("محاسبه", width=320, height=48, on_click=calculate),
            result_text,
            back()
        )

        
        update_ui_based_on_shape()
    # ---------------- ب.م.م / ک.م.م ----------------
    def gcd_lcm():
        clear()
        a = ft.TextField(label="عدد اول")
        b = ft.TextField(label="عدد دوم")
        choice = ft.RadioGroup(
            value="gcd",
            content=ft.Column([
                ft.Radio(value="gcd", label="ب.م.م"),
                ft.Radio(value="lcm", label="ک.م.م"),
            ])
        )
        res = ft.Text()

        def calc(e):
            x, y = int(a.value), int(b.value)
            if choice.value == "gcd":
                res.value = f"ب.م.م = {math.gcd(x, y)}"
            else:
                res.value = f"ک.م.م = {(x*y)//math.gcd(x,y)}"
            page.update()

        page.add(ft.Text("ب.م.م / ک.م.م", size=20), a, b, choice,
                 ft.ElevatedButton("محاسبه", on_click=calc), res, back())

    # ---------------- تبدیل واحد ----------------
    def unit_convert():
        clear()
        value = ft.TextField(label="عدد")
        unit = ft.Dropdown(
            label="تبدیل",
            options=[
                ft.dropdown.Option("mm→cm"),
                ft.dropdown.Option("cm→mm"),
                ft.dropdown.Option("cm→m"),
                ft.dropdown.Option("m→cm"),
                ft.dropdown.Option("m→km"),
                ft.dropdown.Option("km→m"),
                ft.dropdown.Option("m³→liter"),
                ft.dropdown.Option("liter→m³"),
            ]
        )
        res = ft.Text()

        def calc(e):
            x = float(value.value)
            table = {
                "mm→cm": x/10,
                "cm→mm": x*10,
                "cm→m": x/100,
                "m→cm": x*100,
                "m→km": x/1000,
                "km→m": x*1000,
                "m³→liter": x*1000,
                "liter→m³": x/1000,
            }
            res.value = str(table[unit.value])
            page.update()

        page.add(ft.Text("تبدیل واحد", size=20), value, unit, ft.ElevatedButton("تبدیل", on_click=calc), res, back())

# ---------------- تبدیل تاریخ ----------------
    def date_convert_page():
        clear()
        
        
        def jalali_to_gregorian(jy, jm, jd):
            jy_fixed = jy - 979
            g_days = 365 * jy_fixed + (jy_fixed // 33) * 8 + ((jy_fixed % 33 + 3) // 4)
            for i in range(jm - 1):
                g_days += 31 if i < 6 else 30
            g_days += jd - 1
            g_days += 79
            
            gy = 1600 + 400 * (g_days // 146097)
            g_days %= 146097
            if g_days >= 36525:
                g_days -= 1
                gy += 100 * (g_days // 36524)
                g_days %= 36524
                if g_days >= 365:
                    g_days += 1
            gy += 4 * (g_days // 1461)
            g_days %= 1461
            if g_days >= 366:
                g_days -= 1
                gy += g_days // 365
                g_days %= 365
            
            month_lengths = [31, 29 if (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            gm = 0
            for i, length in enumerate(month_lengths):
                if g_days < length:
                    gm = i + 1
                    break
                g_days -= length
            gd = g_days + 1
            return gy, gm, gd

        def gregorian_to_jalali(gy, gm, gd):
            g_days = 365 * (gy - 1600) + (gy - 1597) // 4 - (gy - 1501) // 100 + (gy - 1201) // 400
            month_lengths = [31, 29 if (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            for i in range(gm - 1):
                g_days += month_lengths[i]
            g_days += gd - 1
            
            j_days = g_days - 79
            j_np = j_days // 12053
            j_days %= 12053
            jy = 979 + 33 * j_np + 4 * (j_days // 1461)
            j_days %= 1461
            if j_days >= 366:
                jy += (j_days - 1) // 365
                j_days = (j_days - 1) % 365
            
            jm = 0
            for i in range(12):
                length = 31 if i < 6 else 30
                if j_days < length:
                    jm = i + 1
                    break
                j_days -= length
            jd = j_days + 1
            return jy, jm, jd

        def gregorian_to_jd(gy, gm, gd):
            if gm <= 2:
                gy -= 1
                gm += 12
            A = gy // 100
            B = 2 - A + (A // 4)
            return int(365.25 * (gy + 4716)) + int(30.6001 * (gm + 1)) + gd + B - 1524.5

        def jd_to_gregorian(jd):
            jd += 0.5
            Z = int(jd)
            F = jd - Z
            if Z < 2299161:
                A = Z
            else:
                alpha = int((Z - 1867216.25) / 36524.25)
                A = Z + 1 + alpha - (alpha // 4)
            B = A + 1524
            C = int((B - 122.1) / 365.25)
            D = int(365.25 * C)
            E = int((B - D) / 30.6001)
            gd = B - D - int(30.6001 * E) + F
            gm = E - 1 if E < 14 else E - 13
            gy = C - 4716 if gm > 2 else C - 4715
            return int(gy), int(gm), int(gd)

        def jd_to_hijri(jd):
            l = int(jd) - 1948440 + 10632
            n = (l - 1) // 10631
            l = l - 10631 * n + 354
            j = ((10985 - l) // 5316) * ((50 * l) // 17719) + (l // 5670) * ((43 * l) // 15238)
            l = l - ((30 - j) // 15) * ((17719 * j) // 50) - (j // 16) * ((15238 * j) // 43) + 29
            m = (24 * l) // 709
            d = l - (709 * m) // 24
            y = 30 * n + j - 30
            return int(y), int(m), int(d)

        def hijri_to_jd(hy, hm, hd):
            return int((11 * hy + 3) // 30) + int(354 * hy) + int(30 * hm) - int((hm - 1) // 2) + hd + 1948440 - 385

        # فیلدهای رابط کاربری
        year_field = ft.TextField(label="سال", keyboard_type=ft.KeyboardType.NUMBER, width=100)
        month_field = ft.TextField(label="ماه", keyboard_type=ft.KeyboardType.NUMBER, width=100)
        day_field = ft.TextField(label="روز", keyboard_type=ft.KeyboardType.NUMBER, width=100)
        
        convert_type = ft.Dropdown(
            width=320,
            value="shamsi_to_miladi",
            options=[
                ft.dropdown.Option("shamsi_to_miladi", "شمسی به میلادی"),
                ft.dropdown.Option("miladi_to_shamsi", "میلادی به شمسی"),
                ft.dropdown.Option("shamsi_to_ghamari", "شمسی به قمری"),
                ft.dropdown.Option("ghamari_to_shamsi", "قمری به شمسی"),
                ft.dropdown.Option("miladi_to_ghamari", "میلادی به قمری"),
                ft.dropdown.Option("ghamari_to_miladi", "قمری به میلادی"),
            ]
        )
        
        result_text = ft.Text("", size=18, weight="bold")

        def process_conversion(e):
            try:
                y = int(year_field.value)
                m = int(month_field.value)
                d = int(day_field.value)
                mode = convert_type.value
                
                if mode == "shamsi_to_miladi":
                    gy, gm, gd = jalali_to_gregorian(y, m, d)
                    result_text.value = f"📅 میلادی: {gy}/{gm:02d}/{gd:02d}"
                elif mode == "miladi_to_shamsi":
                    jy, jm, jd = gregorian_to_jalali(y, m, d)
                    result_text.value = f"📅 شمسی: {jy}/{jm:02d}/{jd:02d}"
                elif mode == "shamsi_to_ghamari":
                    gy, gm, gd = jalali_to_gregorian(y, m, d)
                    jd_val = gregorian_to_jd(gy, gm, gd)
                    hy, hm, hd = jd_to_hijri(jd_val)
                    result_text.value = f"📅 قمری: {hy}/{hm:02d}/{hd:02d}"
                elif mode == "ghamari_to_shamsi":
                    jd_val = hijri_to_jd(y, m, d)
                    gy, gm, gd = jd_to_gregorian(jd_val)
                    jy, jm, jd_res = gregorian_to_jalali(gy, gm, gd)
                    result_text.value = f"📅 شمسی: {jy}/{jm:02d}/{jd_res:02d}"
                elif mode == "miladi_to_ghamari":
                    jd_val = gregorian_to_jd(y, m, d)
                    hy, hm, hd = jd_to_hijri(jd_val)
                    result_text.value = f"📅 قمری: {hy}/{hm:02d}/{hd:02d}"
                elif mode == "ghamari_to_miladi":
                    jd_val = hijri_to_jd(y, m, d)
                    gy, gm, gd = jd_to_gregorian(jd_val)
                    result_text.value = f"📅 میلادی: {gy}/{gm:02d}/{gd:02d}"
                
            except:
                result_text.value = "❌ خطا! ورودی‌ها را بررسی کنید."
            page.update()

        page.add(
            ft.Text("📅 تبدیل تاریخ جامع", size=22, weight="bold"),
            convert_type,
            ft.Row([year_field, month_field, day_field], alignment="center"),
            ft.ElevatedButton("تبدیل تاریخ", width=320, height=50, on_click=process_conversion),
            result_text,
            back()
        )
        page.update()

    # ---------------- صفحه تشخیص نوع عدد (اضافه شده جدید) ----------------
    def number_type_page():
        clear()
        num_field = ft.TextField(label="عدد مورد نظر", keyboard_type=ft.KeyboardType.NUMBER, width=320)
        result_text = ft.Text("", size=18, weight="bold")

        def check_type(e):
            try:
                n = int(num_field.value)
                if n < 1:
                    result_text.value = "❌ نرم‌افزار نمی‌تواند اعداد منفی یا صفر را تشخیص دهد."
                elif n == 1:
                    result_text.value = "ℹ عدد 1 نه اول است و نه مرکب."
                else:
                    is_prime = True
                    for i in range(2, int(math.isqrt(n)) + 1):
                        if n % i == 0:
                            is_prime = False
                            break
                    if is_prime:
                        result_text.value = f"✅ عدد {n} یک عدد «اول» است."
                    else:
                        result_text.value = f"🔶 عدد {n} یک عدد «مرکب» است."
            except:
                result_text.value = "❌ ورودی نامعتبر"
            page.update()

        page.add(
            ft.Text("🔍 تشخیص نوع عدد", size=22, weight="bold"),
            num_field,
            ft.ElevatedButton("تشخیص نوع عدد", width=320, height=50, on_click=check_type),
            result_text,
            back()
        )
        page.update()

    # ---------------- آموزش آنلاین (جستجو) ----------------

    def online():
        clear()
        query = ft.TextField(label="چی می‌خوای یاد بگیری؟")

        def search(site):
            if not query.value:
                return

            q = urllib.parse.quote_plus(query.value)

            if site == "aparat":
                url = f"https://www.aparat.com/search/{q}"
            else:
                url = f"https://www.youtube.com/results?search_query={q}"

            webbrowser.open(url)  

        page.add(
            ft.Text("آموزش آنلاین", size=20),
            query,
            ft.ElevatedButton("جستجو در آپارات", on_click=lambda e: search("aparat")),
            ft.ElevatedButton("جستجو در یوتیوب", on_click=lambda e: search("youtube")),
            back()
        )

    # ---------------- درباره ما ----------------

    def about():
        clear()
        page.add(
            ft.Text("درباره ما", size=30, weight="bold"),
            ft.Text("طراح و توسعه دهنده: حسین ثقفی\nنرم‌افزار ریاضی چند منظوره با امکانات آموزشی و محاسباتی"),
            back()
        )

    # ---------------- زیرمنوی شمارنده / مضرب ----------------
    def dm_menu():
        clear()
        page.add(
            ft.Text("🔢 انتخاب عملیات", size=22, weight="bold"),
            mobile_button("🔢 شمارنده‌ها", lambda e: divisors_page()),
            mobile_button("🔁 مضرب‌ها", lambda e: multiples_page()),
            back()
        )

    # ---------------- صفحه شمارنده‌ها ----------------
    def divisors_page():
        clear()
        num = ft.TextField(label="عدد مورد نظر", keyboard_type=ft.KeyboardType.NUMBER)
        result = ft.Text(selectable=True)

        def calc(e):
            try:
                n = int(num.value)
                d = [i for i in range(1, n + 1) if n % i == 0]
                result.value = (
                    f"📌 شمارنده‌ها:\n{d}\n\n"
                    f"کوچک‌ترین: {min(d)}\n"
                    f"بزرگ‌ترین: {max(d)}"
                )
                page.update()
            except:
                result.value = "❌ ورودی نامعتبر"
                page.update()

        page.add(
            ft.Text("🔢 محاسبه شمارنده‌ها", size=20, weight="bold"),
            num,
            ft.ElevatedButton("محاسبه", on_click=calc),
            result,
            back()
        )

    # ---------------- صفحه مضرب‌ها ----------------
    def multiples_page():
        clear()
        num = ft.TextField(label="عدد مورد نظر", keyboard_type=ft.KeyboardType.NUMBER)
        count = ft.TextField(label="تعداد مضرب‌ها", keyboard_type=ft.KeyboardType.NUMBER)
        result = ft.Text(selectable=True)

        def calc(e):
            try:
                n = int(num.value)
                c = int(count.value)
                m = [n * i for i in range(1, c + 1)]
                result.value = (
                    f"📌 مضرب‌ها:\n{m}\n\n"
                    f"کوچک‌ترین: {min(m)}\n"
                    f"بزرگ‌ترین: {max(m)}"
                )
                page.update()
            except:
                result.value = "❌ ورودی نامعتبر"
                page.update()

        page.add(
            ft.Text("🔁 محاسبه مضرب‌ها", size=20, weight="bold"),
            num,
            count,
            ft.ElevatedButton("محاسبه", on_click=calc),
            result,
            back()
        )


    menu()


ft.run(main)


# flet pack exersise.py --icon my_icon.ico --name "MyFirstApp"