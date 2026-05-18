import requests
import json

base = "http://localhost:8000/api"

# Login
s = requests.Session()
r = s.post(f"{base}/auth/login", json={"email": "admin@lizam.sa", "password": "Lizam@2026"})
print("Login:", r.status_code)

authors = [
    {"name_ar": "د. فهد العتيبي", "name_en": "Dr. Fahad Al-Otaibi", "title_ar": "أستاذ القانون الدستوري", "title_en": "Professor of Constitutional Law", "bio_ar": "متخصص في القانون الدستوري ومقارنة الأنظمة التشريعية، صاحب مؤلفات في الفقه الدستوري السعودي.", "bio_en": "Specialist in constitutional law and comparative legislative systems.", "active": True},
    {"name_ar": "أ.د. منى الشهري", "name_en": "Prof. Mona Al-Shehri", "title_ar": "أستاذة القانون الخاص", "title_en": "Professor of Private Law", "bio_ar": "تركّز أبحاثها على قانون الأسرة والأحوال الشخصية في ضوء التحولات التشريعية.", "bio_en": "Research focuses on family law and personal status in light of Saudi legislative transformations.", "active": True},
    {"name_ar": "د. خالد الزهراني", "name_en": "Dr. Khalid Al-Zahrani", "title_ar": "باحث في القانون الجنائي", "title_en": "Criminal Law Researcher", "bio_ar": "متخصص في العدالة الجنائية وإصلاح منظومة التقاضي في المملكة العربية السعودية.", "bio_en": "Specialist in criminal justice and judicial system reform in Saudi Arabia.", "active": True},
    {"name_ar": "أ. سارة المطيري", "name_en": "Ms. Sara Al-Mutairi", "title_ar": "باحثة في قانون الأعمال", "title_en": "Business Law Researcher", "bio_ar": "تبحث في قوانين الاستثمار والشراكات وحوكمة الشركات في إطار رؤية 2030.", "bio_en": "Researches investment laws, partnerships, and corporate governance within Vision 2030.", "active": True},
    {"name_ar": "د. عمر القرني", "name_en": "Dr. Omar Al-Qarni", "title_ar": "متخصص في القانون الدولي", "title_en": "International Law Specialist", "bio_ar": "يعمل على ملفات المعاهدات الدولية والتحكيم التجاري وحل النزاعات عبر الحدود.", "bio_en": "Works on international treaties, commercial arbitration, and cross-border dispute resolution.", "active": True},
    {"name_ar": "د. نورة الدوسري", "name_en": "Dr. Noura Al-Dosari", "title_ar": "باحثة في السياسات العامة", "title_en": "Public Policy Researcher", "bio_ar": "تُحلّل الأطر التشريعية للسياسات العامة وأثرها على التنمية الاقتصادية والاجتماعية.", "bio_en": "Analyzes legislative frameworks for public policies and their impact on development.", "active": True},
]

for a in authors:
    r = s.post(f"{base}/admin/authors", json=a)
    if r.status_code == 200:
        print("OK: " + r.json().get('name_en', '?'))
    else:
        print("ERR: " + str(r.status_code))
