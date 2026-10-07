import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- SMARTUNI SEED STARTED ---');

  // 1. UNIVERSITY
  const university = await prisma.university.upsert({
    where: { name: 'Шоқан Уәлиханов атындағы Көкшетау университеті' },
    update: {
      shortName: 'ШУ',
    },
    create: {
      name: 'Шоқан Уәлиханов атындағы Көкшетау университеті',
      shortName: 'ШУ',
    },
  });
  console.log('✓ University:', university.name);

  // 2. FACULTY
  const faculty = await prisma.faculty.upsert({
    where: {
      universityId_name: {
        universityId: university.id,
        name: 'Ақпараттық-коммуникациялық технологиялар факультеті',
      },
    },
    update: {},
    create: {
      name: 'Ақпараттық-коммуникациялық технологиялар факультеті',
      universityId: university.id,
    },
  });
  console.log('✓ Faculty:', faculty.name);

  // 3. MAJOR
  const major = await prisma.major.upsert({
    where: {
      facultyId_name: {
        facultyId: faculty.id,
        name: 'Ақпараттық жүйелер',
      },
    },
    update: {},
    create: {
      name: 'Ақпараттық жүйелер',
      facultyId: faculty.id,
    },
  });
  console.log('✓ Major:', major.name);

  // 4. ADMIN USER
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartuni.kz' },
    update: {
      fullName: 'SmartUni Admin',
      phone: '+77009998877',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      fullName: 'SmartUni Admin',
      email: 'admin@smartuni.kz',
      phone: '+77009998877',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✓ Admin user:', adminUser.email);

  // 5. TEACHER USER & PROFILE
  const teacherPasswordHash = await bcrypt.hash('Teacher123!', 12);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@smartuni.kz' },
    update: {
      fullName: 'Айдар Тест Мұғалім',
      phone: '+77001112233',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      fullName: 'Айдар Тест Мұғалім',
      email: 'teacher@smartuni.kz',
      phone: '+77001112233',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {
      universityId: university.id,
      facultyId: faculty.id,
      department: 'Информатика және ақпараттық жүйелер кафедрасы',
      position: 'Аға оқытушы',
      experience: 8,
      bio: 'Web бағдарламалау және цифрлық жүйелер маманы',
      premium: true,
    },
    create: {
      userId: teacherUser.id,
      universityId: university.id,
      facultyId: faculty.id,
      department: 'Информатика және ақпараттық жүйелер кафедрасы',
      position: 'Аға оқытушы',
      experience: 8,
      bio: 'Web бағдарламалау және цифрлық жүйелер маманы',
      premium: true,
    },
  });
  console.log('✓ Teacher profile ready for:', teacherUser.email);

  // 6. STUDENT 1 (Active member in IS-23-1)
  const studentPasswordHash = await bcrypt.hash('Student123!', 12);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@smartuni.kz' },
    update: {
      fullName: 'Тест Студент',
      phone: '+77012345678',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      fullName: 'Тест Студент',
      email: 'student@smartuni.kz',
      phone: '+77012345678',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: true,
    },
    create: {
      userId: studentUser.id,
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: true,
    },
  });
  console.log('✓ Student profile ready for:', studentUser.email);

  // 7. STUDENT 2 (Demo student with PENDING request for Teacher Requests UI test)
  const student2PasswordHash = await bcrypt.hash('Student123!', 12);
  const student2User = await prisma.user.upsert({
    where: { email: 'demo.student@smartuni.kz' },
    update: {
      fullName: 'Нұржан Серікұлы',
      phone: '+77029876543',
      passwordHash: student2PasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      fullName: 'Нұржан Серікұлы',
      email: 'demo.student@smartuni.kz',
      phone: '+77029876543',
      passwordHash: student2PasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const student2Profile = await prisma.studentProfile.upsert({
    where: { userId: student2User.id },
    update: {
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: false,
    },
    create: {
      userId: student2User.id,
      universityId: university.id,
      facultyId: faculty.id,
      majorId: major.id,
      course: 2,
      premium: false,
    },
  });
  console.log('✓ Second demo student ready for Teacher Requests test:', student2User.email);

  // 8. SUBJECT
  let subject = await prisma.subject.findFirst({
    where: { name: 'Web бағдарламалау' },
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: 'Web бағдарламалау',
        code: 'WEB101',
        description: 'Frontend және Backend заманауи технологиялары',
      },
    });
  }
  console.log('✓ Subject:', subject.name, `(${subject.code})`);

  // 9. GROUP (IS-23-1)
  let group = await prisma.group.findFirst({
    where: {
      name: 'IS-23-1',
      subjectId: subject.id,
      teacherId: teacherProfile.id,
    },
  });

  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'IS-23-1',
        subjectId: subject.id,
        teacherId: teacherProfile.id,
        course: 2,
        capacity: 30,
        semester: 1,
        academicYear: '2026-2027',
        lessonDay: 'Дүйсенбі',
        lessonTime: '14:00',
        classroom: '301',
        status: 'ACTIVE',
        createdById: teacherUser.id,
      },
    });
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: {
        course: 2,
        capacity: 30,
        semester: 1,
        academicYear: '2026-2027',
        lessonDay: 'Дүйсенбі',
        lessonTime: '14:00',
        classroom: '301',
        status: 'ACTIVE',
      },
    });
  }
  console.log('✓ Group:', group.name);

  // 10. GROUP MEMBERSHIP (Student 1 is ACTIVE member)
  await prisma.groupMembership.upsert({
    where: {
      studentId_groupId: {
        studentId: studentProfile.id,
        groupId: group.id,
      },
    },
    update: {
      status: 'ACTIVE',
      leftAt: null,
    },
    create: {
      studentId: studentProfile.id,
      groupId: group.id,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Group membership created for Student 1 in IS-23-1');

  // 11. DEMO PENDING JOIN REQUEST (Student 2 has PENDING request for Teacher to accept/reject)
  const existingPending = await prisma.joinRequest.findFirst({
    where: {
      studentId: student2Profile.id,
      groupId: group.id,
      status: 'PENDING',
    },
  });

  if (!existingPending) {
    await prisma.joinRequest.create({
      data: {
        studentId: student2Profile.id,
        groupId: group.id,
        status: 'PENDING',
      },
    });
  }
  // 12. DEMO TOPICS & MATERIALS FOR 'Web бағдарламалау'
  const topicsData = [
    {
      title: 'HTML негіздері',
      description: 'HTML5 гипермәтіндік белгілеу тілі, тегтер құрылымы және семантикалық элементтер',
      order: 1,
      materials: [
        {
          title: 'HTML дегеніміз не?',
          description: 'Веб парақшалардың құрылымы, браузер жұмысы және HTML5 стандартымен танысу.',
          type: 'LECTURE' as const,
          contentText: 'HTML (HyperText Markup Language) — веб-парақшаларды құруға арналған стандартты белгілеу тілі. Ол парақшаның мазмұны мен құрылымын сипаттайды. Браузер HTML құжатын оқып, оны визуалды түрде экранда көрсетеді.',
          order: 1,
        },
        {
          title: 'HTML құрылымы және тегтер',
          description: 'Негізгі тегтер: <html>, <head>, <body>, тақырыптар (h1-h6), абзацтар, тізімдер және сілтемелер.',
          type: 'LECTURE' as const,
          contentText: 'Кез келген дұрыс HTML5 құжаты <!DOCTYPE html> декларациясынан басталады. Одан кейін <html> контейнері, оның ішінде мета-ақпарат сақтайтын <head> және көзге көрінетін мазмұнды қамтитын <body> орналасады.',
          order: 2,
        },
        {
          title: 'HTML introduction video',
          description: 'HTML құрылымын 15 минутта меңгеру бейнедәрісі.',
          type: 'VIDEO' as const,
          contentUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
          contentText: 'Бұл бейнедәрісте HTML тегтері, атрибуттары және мәтінді пішімдеу ережелері нақты мысалдармен түсіндіріледі.',
          order: 3,
        },
        {
          title: 'HTML пайдалы ресурстар қоры',
          description: 'MDN Web Docs және W3Schools ресми құжаттамаларына сілтемелер.',
          type: 'ADDITIONAL_RESOURCE' as const,
          contentUrl: 'https://developer.mozilla.org/ru/docs/Web/HTML',
          contentText: 'Қосымша оқу үшін MDN Web Docs (Mozilla Developer Network) анықтамалығын қарап шығыңыз.',
          order: 4,
        },
      ],
    },
    {
      title: 'CSS негіздері',
      description: 'Каскадты стиль кестелері, селекторлар және Box Model тұжырымдамасы',
      order: 2,
      materials: [
        {
          title: 'CSS кіріспе',
          description: 'CSS синтаксисі, стильдерді қосу жолдары (inline, internal, external).',
          type: 'LECTURE' as const,
          contentText: 'CSS (Cascading Style Sheets) — HTML элементтерінің визуалды көрінісін (түсін, қаріпін, өлшемін, орналасуын) безендіруге арналған стильдер тілі.',
          order: 1,
        },
        {
          title: 'Селекторлар және специфика',
          description: 'Тег, класс, идентификатор селекторлары және псевдокластар.',
          type: 'LECTURE' as const,
          contentText: 'CSS селекторлары стильдер қай элементке қолданылатынын анықтайды. Класс (.class) бірнеше элементке қолданылса, ID (#id) тек бір бірегей элементке беріледі.',
          order: 2,
        },
        {
          title: 'Box Model моделі',
          description: 'Margin, border, padding және content өзара байланысы.',
          type: 'LECTURE' as const,
          contentText: 'CSS Box Model — кез келген HTML элементін қоршап тұрған төрт қабат: Content (мазмұн), Padding (ішкі бос орын), Border (шекара) және Margin (сыртқы шегініс).',
          order: 3,
        },
        {
          title: 'CSS Flexbox & Layout video',
          description: 'Заманауи Flexbox торлары арқылы интерфейсті жинақтау.',
          type: 'VIDEO' as const,
          contentUrl: 'https://www.youtube.com/watch?v=JJSoEo8JSnc',
          contentText: 'Flexbox контейнерлері және бағыттарын басқару бойынша толық нұсқаулық.',
          order: 4,
        },
      ],
    },
    {
      title: 'JavaScript негіздері',
      description: 'Интерактивті веб-қосымшалар, айнымалылар, функциялар және DOM манипуляциясы',
      order: 3,
      materials: [
        {
          title: 'JavaScript кіріспе',
          description: 'Браузерде JS орындау ортасы, синтаксис және деректер типтері.',
          type: 'LECTURE' as const,
          contentText: 'JavaScript — браузерді жан бітіретін динамикалық бағдарламалау тілі. Ол пайдаланушының іс-әрекеттеріне жауап береді және интерфейсті өзгерте алады.',
          order: 1,
        },
        {
          title: 'Айнымалылар және деректер типтері',
          description: 'let, const, var айырмашылықтары, примитивті және күрделі типтер.',
          type: 'LECTURE' as const,
          contentText: 'Заманауи ES6 стандартында өзгермелі мәндер үшін `let`, ал тұрақты мәндер үшін `const` қолданылады. `var` қолдану ұсынылмайды.',
          order: 2,
        },
        {
          title: 'Функциялар және оқиғалар (Events)',
          description: 'Дәстүрлі функциялар, Arrow functions және click оқиғалары.',
          type: 'LECTURE' as const,
          contentText: 'Функциялар қайта қолданылатын код блоктары болып табылады. Олар параметр қабылдап, мән қайтара алады (return).',
          order: 3,
        },
        {
          title: 'JavaScript оқу ресурстары',
          description: 'JavaScript.info интерактивті оқулығы және жаттығулар.',
          type: 'ADDITIONAL_RESOURCE' as const,
          contentUrl: 'https://learn.javascript.ru',
          contentText: 'Тілді терең меңгеруге арналған ең үздік тегін заманауи оқулық.',
          order: 4,
        },
      ],
    },
  ];

  for (const tData of topicsData) {
    let topic = await prisma.topic.findFirst({
      where: {
        subjectId: subject.id,
        title: tData.title,
      },
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          subjectId: subject.id,
          title: tData.title,
          description: tData.description,
          order: tData.order,
        },
      });
    } else {
      topic = await prisma.topic.update({
        where: { id: topic.id },
        data: {
          description: tData.description,
          order: tData.order,
        },
      });
    }

    for (const mData of tData.materials) {
      const existingMat = await prisma.material.findFirst({
        where: {
          topicId: topic.id,
          title: mData.title,
        },
      });

      if (!existingMat) {
        await prisma.material.create({
          data: {
            topicId: topic.id,
            title: mData.title,
            description: mData.description,
            type: mData.type,
            contentUrl: mData.contentUrl,
            contentText: mData.contentText,
            order: mData.order,
          },
        });
      } else {
        await prisma.material.update({
          where: { id: existingMat.id },
          data: {
            description: mData.description,
            type: mData.type,
            contentUrl: mData.contentUrl,
            contentText: mData.contentText,
            order: mData.order,
          },
        });
      }
    }
  }
  console.log('✓ Demo LMS Topics and Materials successfully seeded for Subject:', subject.name);

  // 13. DEMO ASSIGNMENTS
  const assignmentsData = [
    {
      topicTitle: 'HTML негіздері',
      title: 'HTML бет жасау',
      description: 'Жеке визитка немесе қарапайым портал бетін HTML тегтерімен жинақтау. Кодты мәтін немесе HTML файл ретінде жіберіңіз.',
      responseType: 'TEXT_AND_FILE' as const,
      maxScore: 100,
      deadlineDays: 5,
      allowLate: true,
    },
    {
      topicTitle: 'HTML негіздері',
      title: 'HTML формалар',
      description: 'Тіркелу формасын жасау: input (мәтін, email, құпиясөз), select, textarea және submit батырмасы.',
      responseType: 'TEXT' as const,
      maxScore: 100,
      deadlineDays: 7,
      allowLate: false,
    },
    {
      topicTitle: 'CSS негіздері',
      title: 'Responsive layout жасау',
      description: 'Flexbox немесе Grid арқылы мобильді және десктоп экрандарға бейімделген макет жасау. Архив немесе CSS файлын тіркеңіз.',
      responseType: 'FILE' as const,
      maxScore: 100,
      deadlineDays: 10,
      allowLate: true,
    },
    {
      topicTitle: 'JavaScript негіздері',
      title: 'JavaScript функциялары',
      description: 'Массивтермен және жолдармен жұмыс істейтін 3 функция жазып, консольдегі нәтижесін мәтіндік жауап ретінде жіберіңіз.',
      responseType: 'TEXT' as const,
      maxScore: 100,
      deadlineDays: 14,
      allowLate: false,
    },
  ];

  for (const aData of assignmentsData) {
    const topic = await prisma.topic.findFirst({
      where: {
        subjectId: subject.id,
        title: aData.topicTitle,
      },
    });

    if (topic) {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + aData.deadlineDays);

      const existingAssign = await prisma.assignment.findFirst({
        where: {
          topicId: topic.id,
          title: aData.title,
        },
      });

      if (!existingAssign) {
        await prisma.assignment.create({
          data: {
            topicId: topic.id,
            title: aData.title,
            description: aData.description,
            responseType: aData.responseType,
            maxScore: aData.maxScore,
            deadline: deadlineDate,
            allowLate: aData.allowLate,
          },
        });
      } else {
        await prisma.assignment.update({
          where: { id: existingAssign.id },
          data: {
            description: aData.description,
            responseType: aData.responseType,
            maxScore: aData.maxScore,
            allowLate: aData.allowLate,
          },
        });
      }
    }
  }
  console.log('✓ Demo LMS Assignments successfully seeded');

  // 12. DEMO LMS TESTS
  const htmlTopic = await prisma.topic.findFirst({
    where: {
      subjectId: subject.id,
      title: 'HTML негіздері және тегтер жүйесі',
    },
  });

  let demoTest = await prisma.test.findFirst({
    where: {
      subjectId: subject.id,
      title: 'HTML негіздері бойынша тест',
    },
  });

  const testScheduledDate = new Date();
  testScheduledDate.setDate(testScheduledDate.getDate() + 2);
  testScheduledDate.setHours(11, 0, 0, 0);

  if (!demoTest) {
    demoTest = await prisma.test.create({
      data: {
        subjectId: subject.id,
        topicId: htmlTopic ? htmlTopic.id : null,
        title: 'HTML негіздері бойынша тест',
        description: 'HTML құжатының негізгі құрылымын тексеруге арналған тест.',
        durationMinutes: 15,
        maxScore: 10,
        status: 'PUBLISHED',
        scheduledAt: testScheduledDate,
        shuffleQuestions: false,
        shuffleAnswers: false,
        showResultsImmediately: true,
        createdByTeacherProfileId: teacherProfile.id,
      },
    });
  } else {
    demoTest = await prisma.test.update({
      where: { id: demoTest.id },
      data: {
        topicId: htmlTopic ? htmlTopic.id : null,
        description: 'HTML құжатының негізгі құрылымын тексеруге арналған тест.',
        durationMinutes: 15,
        maxScore: 10,
        status: 'PUBLISHED',
        scheduledAt: testScheduledDate,
        showResultsImmediately: true,
      },
    });
  }

  const demoQuestions = [
    {
      order: 1,
      type: 'SINGLE_CHOICE' as const,
      questionText: 'HTML дегеніміз не?',
      points: 1,
      explanation: 'HTML — HyperText Markup Language, яғни гипермәтіндік белгілеу тілі.',
      options: [
        { optionText: 'HyperText Markup Language', isCorrect: true, order: 1 },
        { optionText: 'High Text Machine Language', isCorrect: false, order: 2 },
        { optionText: 'Hyperlink and Text Model Language', isCorrect: false, order: 3 },
        { optionText: 'Home Tool Markup Language', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 2,
      type: 'SINGLE_CHOICE' as const,
      questionText: 'HTML құжатының негізгі root element-і қандай?',
      points: 1,
      explanation: 'Барлық элементтер <html> түбірлік элементінің ішінде орналасады.',
      options: [
        { optionText: '<html>', isCorrect: true, order: 1 },
        { optionText: '<head>', isCorrect: false, order: 2 },
        { optionText: '<body>', isCorrect: false, order: 3 },
        { optionText: '<root>', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 3,
      type: 'SINGLE_CHOICE' as const,
      questionText: '<p> тегі не үшін қолданылады?',
      points: 1,
      explanation: '<p> тегі параграф (абзац) мәтінін анықтау үшін қызмет етеді.',
      options: [
        { optionText: 'Параграф (абзац) жасау үшін', isCorrect: true, order: 1 },
        { optionText: 'Сурет қою үшін', isCorrect: false, order: 2 },
        { optionText: 'Сілтеме беру үшін', isCorrect: false, order: 3 },
        { optionText: 'Кесте құру үшін', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 4,
      type: 'SINGLE_CHOICE' as const,
      questionText: '<a> тегі не үшін қолданылады?',
      points: 1,
      explanation: '<a> тегі гиперсілтеме жасау және басқа бетке өту үшін қолданылады.',
      options: [
        { optionText: 'Гиперсілтеме (link) құру үшін', isCorrect: true, order: 1 },
        { optionText: 'Анимация қосу үшін', isCorrect: false, order: 2 },
        { optionText: 'Дыбыс ойнату үшін', isCorrect: false, order: 3 },
        { optionText: 'Абзац бөлу үшін', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 5,
      type: 'MULTIPLE_CHOICE' as const,
      questionText: 'Төмендегі тегтердің қайсылары блоктық (block-level) элементтер болып табылады?',
      points: 1,
      explanation: '<div> және <p> — блоктық элементтер, ал <span> мен <a> — жолдық (inline) элементтер.',
      options: [
        { optionText: '<div>', isCorrect: true, order: 1 },
        { optionText: '<p>', isCorrect: true, order: 2 },
        { optionText: '<span>', isCorrect: false, order: 3 },
        { optionText: '<a>', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 6,
      type: 'TRUE_FALSE' as const,
      questionText: 'HTML5-те барлық тегтер міндетті түрде жабылуы керек (мысалы <img>, <br>)?',
      points: 1,
      explanation: 'HTML5 стандартында бос элементтер (void elements) жабылу тегін қажет етпейді.',
      options: [
        { optionText: 'Иә (True)', isCorrect: false, order: 1 },
        { optionText: 'Жоқ (False)', isCorrect: true, order: 2 },
      ],
    },
    {
      order: 7,
      type: 'SINGLE_CHOICE' as const,
      questionText: '<img> тегінде сурет адресін көрсетуге арналған негізгі атрибут қандай?',
      points: 1,
      explanation: 'src атрибуты суреттің URL немесе файл жолын береді.',
      options: [
        { optionText: 'src', isCorrect: true, order: 1 },
        { optionText: 'href', isCorrect: false, order: 2 },
        { optionText: 'link', isCorrect: false, order: 3 },
        { optionText: 'path', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 8,
      type: 'SINGLE_CHOICE' as const,
      questionText: 'HTML-де ең үлкен деңгейлі тақырып (heading) тегі қандай?',
      points: 1,
      explanation: '<h1> ең маңызды әрі ең үлкен тақырыпты анықтайды.',
      options: [
        { optionText: '<h1>', isCorrect: true, order: 1 },
        { optionText: '<h6>', isCorrect: false, order: 2 },
        { optionText: '<head>', isCorrect: false, order: 3 },
        { optionText: '<header>', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 9,
      type: 'MULTIPLE_CHOICE' as const,
      questionText: 'Төмендегілердің қайсысы семантикалық (semantic) HTML5 тегтеріне жатады?',
      points: 1,
      explanation: '<header>, <article> және <footer> мазмұнның мағыналық құрылымын білдіреді.',
      options: [
        { optionText: '<header>', isCorrect: true, order: 1 },
        { optionText: '<article>', isCorrect: true, order: 2 },
        { optionText: '<footer>', isCorrect: true, order: 3 },
        { optionText: '<div class="main">', isCorrect: false, order: 4 },
      ],
    },
    {
      order: 10,
      type: 'OPEN_TEXT' as const,
      questionText: 'HTML формасында деректерді қауіпсіз жіберу үшін <form> тегінде қандай method (HTTP әдісі) қолданылады және неліктен?',
      points: 1,
      explanation: 'POST әдісі қолданылады, өйткені ол деректерді URL мекенжайында емес, сұраныс денесінде (body) жібереді.',
      options: [],
    },
  ];

  for (const qData of demoQuestions) {
    let question = await prisma.testQuestion.findFirst({
      where: {
        testId: demoTest.id,
        order: qData.order,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      question = await prisma.testQuestion.create({
        data: {
          testId: demoTest.id,
          order: qData.order,
          type: qData.type,
          questionText: qData.questionText,
          points: qData.points,
          explanation: qData.explanation,
          options: {
            create: qData.options.map((opt) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          },
        },
        include: {
          options: true,
        },
      });
    } else {
      await prisma.testQuestion.update({
        where: { id: question.id },
        data: {
          type: qData.type,
          questionText: qData.questionText,
          points: qData.points,
          explanation: qData.explanation,
        },
      });

      // Update options
      for (const opt of qData.options) {
        const existingOpt = question.options.find((o) => o.order === opt.order);
        if (existingOpt) {
          await prisma.testOption.update({
            where: { id: existingOpt.id },
            data: {
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            },
          });
        } else {
          await prisma.testOption.create({
            data: {
              questionId: question.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              order: opt.order,
            },
          });
        }
      }
    }
  }
  console.log('✓ Demo LMS Test (10 questions) successfully seeded');

  // 13. DEMO STUDENT PROGRESS & ACADEMIC SEED (IDEMPOTENT)
  const allMaterials = await prisma.material.findMany({
    where: {
      topic: { subjectId: subject.id },
    },
    orderBy: { order: 'asc' },
  });

  if (allMaterials.length >= 3) {
    // 3 materials COMPLETED
    for (let i = 0; i < 3; i++) {
      await prisma.studentMaterialProgress.upsert({
        where: {
          studentId_materialId: {
            studentId: studentProfile.id,
            materialId: allMaterials[i].id,
          },
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        create: {
          studentId: studentProfile.id,
          materialId: allMaterials[i].id,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // 1 material STARTED if available
    if (allMaterials.length > 3) {
      await prisma.studentMaterialProgress.upsert({
        where: {
          studentId_materialId: {
            studentId: studentProfile.id,
            materialId: allMaterials[3].id,
          },
        },
        update: {
          status: 'STARTED',
          startedAt: new Date(),
        },
        create: {
          studentId: studentProfile.id,
          materialId: allMaterials[3].id,
          status: 'STARTED',
          startedAt: new Date(),
        },
      });
    }
    console.log('✓ Demo Student 1 Material Progress seeded (3 completed, 1 started)');
  }

  // Demo Graded Assignment Submission (87 / 100)
  const firstAssignment = await prisma.assignment.findFirst({
    where: {
      topic: { subjectId: subject.id },
    },
  });

  if (firstAssignment) {
    await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: firstAssignment.id,
          studentId: studentProfile.id,
        },
      },
      update: {
        status: 'GRADED',
        score: 87,
        teacherComment: 'Жақсы орындалған жұмыс. Тәжірибелік дағдыларыңыз керемет.',
        gradedAt: new Date(),
      },
      create: {
        assignmentId: firstAssignment.id,
        studentId: studentProfile.id,
        textAnswer: 'HTML құжаты мен басты семантикалық құрылымдары толық орындалды.',
        status: 'GRADED',
        submittedAt: new Date(),
        score: 87,
        teacherComment: 'Жақсы орындалған жұмыс. Тәжірибелік дағдыларыңыз керемет.',
        gradedAt: new Date(),
      },
    });
    console.log('✓ Demo Student 1 Graded Assignment Submission seeded (87/100)');
  }

  // Demo Completed Test Attempt (80% / 8 correct answers)
  const existingAttempt = await prisma.testAttempt.findFirst({
    where: {
      testId: demoTest.id,
      studentProfileId: studentProfile.id,
    },
  });

  if (!existingAttempt) {
    await prisma.testAttempt.create({
      data: {
        testId: demoTest.id,
        studentProfileId: studentProfile.id,
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        score: 8,
        percentage: 80,
        correctAnswers: 8,
        totalQuestions: 10,
      },
    });
  } else {
    await prisma.testAttempt.update({
      where: { id: existingAttempt.id },
      data: {
        status: 'COMPLETED',
        score: 8,
        percentage: 80,
        correctAnswers: 8,
        totalQuestions: 10,
      },
    });
  }
  console.log('✓ Demo Student 1 Test Attempt seeded (80%)');

  console.log('====================================================');
  console.log('🎉 SMARTUNI SEED COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('Credentials:');
  console.log('1. Admin:   admin@smartuni.kz   / Admin123!');
  console.log('2. Teacher: teacher@smartuni.kz / Teacher123!');
  console.log('3. Student: student@smartuni.kz / Student123!');
  console.log('4. Demo 2:  demo.student@smartuni.kz / Student123!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
