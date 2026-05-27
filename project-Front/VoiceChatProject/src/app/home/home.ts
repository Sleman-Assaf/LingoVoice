import { Component } from '@angular/core';
import { CommonModule, NgForOf } from "../../../node_modules/@angular/common/types/_common_module-chunk";


@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  cards= [
{
icon:"fa-solid fa-microphone",
title:"Real-time conversation",
describtion:"Talk with AI like a real person and improve your speaking skills."},

{
icon:"fa-solid fa-bolt",
title:"instant corrections",
describtion:"Talk with AI like a real person and improve your speaking skills."},


{
icon:"fa-solid fa-check",
title:"Multiple Languges",
describtion:"Talk with AI like a real person and improve your speaking skills."},

  ];


  cards2=[

{
  icon:"fa-solid fa-earth-americas",
  title:"choose your languge",
  describtion:"lorem lorem lorem lorem"
},
{
  icon:"fa-solid fa-microphone",
  title:"Start Voice Convirsionts",
  describtion:"lorem lorem lorem lorem"
},
{
  icon:"fa-solid fa-check",
  title:"Get Corrections and improve",
  describtion:"lorem lorem lorem lorem"
},


  ]


usersInfo = [
  {
    urlPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    userName: 'Malek',
    userSpicalist: 'AI',
    userRev: 'This is a great website to learn languages.'
  },
  {
    urlPhoto: 'https://randomuser.me/api/portraits/men/44.jpg',
    userName: 'Marwan',
    userSpicalist: 'Language Coach',
    userRev: 'The conversations feel natural and helped me improve my speaking confidence.'
  },
  {
    urlPhoto: 'https://randomuser.me/api/portraits/men/75.jpg',
    userName: 'Sleman',
    userSpicalist: 'English Learner',
    userRev: 'I really like the instant feedback and the simple way of practicing every day.'
  },
  {
    urlPhoto: 'https://randomuser.me/api/portraits/men/68.jpg',
    userName: 'mohammed',
    userSpicalist: 'Spanish Learner',
    userRev: 'The design is simple and the practice sessions are very useful.'
  },
  {
    urlPhoto: 'https://randomuser.me/api/portraits/men/41.jpg',
    userName: 'Omar',
    userSpicalist: 'Student',
    userRev: 'I can practice every day without feeling bored.'
  },
  {
    urlPhoto: 'https://randomuser.me/api/portraits/women/21.jpg',
    userName: 'Nora',
    userSpicalist: 'Beginner',
    userRev: 'It helped me speak with more confidence in a short time.'
  }
];

groupedUsers: any[][] = [];

ngOnInit() {
  this.groupUsers(3);
}

groupUsers(size: number) {
  for (let i = 0; i < this.usersInfo.length; i += size) {
    this.groupedUsers.push(this.usersInfo.slice(i, i + size));
  }
}


}


