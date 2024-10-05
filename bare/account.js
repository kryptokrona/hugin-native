class Account {
  constructor() {
    //Random test data
    this.name = 'nils';
    this.address =
      'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme';
    this.avatar = '';
    this.rooms = [];
    this.downloadDir = '';
  }

  init(data) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
  }

  update(data) {
    this.name = data.name;
    this.address = data.address;
    this.avatar = data.avatar;
  }
}

let Hugin = new Account();

module.exports = { Hugin };
