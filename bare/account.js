class Account {
  constructor() {
    this.name = 'nils';
    this.address = '';
    this.avatar = '';
    this.rooms = [];
  }

  init(data) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
  }
}

let Hugin = new Account();

module.exports = { Hugin };
