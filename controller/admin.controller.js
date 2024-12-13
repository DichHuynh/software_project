const Account = require("../model/accounts.model.js");
const Admin = require("../model/admin.model.js");
const Tech = require("../model/tech.model.js");
const User = require("../model/user.model.js");
const Issue = require("../model/issue.model.js");

module.exports.index = async (req, res)=>{
  const userId = req.params.id;
  res.render("admin/pages/AdminHome.pug", {
    title: "Admin Home",
    userId: userId
  });
  };

module.exports.setAccount = async (req, res) => {
  const accountId = req.params.id;
  const admin = await Admin.findOne({
    where: { account_id: accountId },
    include: {
      model: Account,
      required: true
    }
  });
  console.log(admin);
  res.render("admin/pages/setAccount.pug",{
    title: "Set Account",
    admin: admin,
    userId: accountId
  })
}; 

module.exports.manageUserAccount = async (req, res) => {
  const accountId = req.params.id;
  const listUser =  await User.findAll({
    attributes: ["user_id", "name", "address"],
    include: [
      {
        model: Account,
        attributes: ['email', 'avatar', "password", "status", "account_id"],
      }
    ]
  })
  res.render("admin/pages/manageUserAccount.pug",{
    title: "Manage User Account",
    userId: accountId,
    listUser: listUser
  });
};

module.exports.deleteUser = async (req, res) => {
  const { userId, accountId } = req.params;
    // Xóa người dùng dựa trên user_id
  await User.destroy({
    where: { user_id: userId }
  });
  await Account.destroy({
    where: { account_id: accountId }
  });
  res.redirect("back");
};

module.exports.changeStatus = async (req, res) => {
  const { userId, status } = req.params; // Lấy thông tin từ params
  // Tìm người dùng trong bảng User
  const user = await User.findOne({ where: { user_id: userId } });

    // Sử dụng account_id để cập nhật trạng thái trong bảng Account
  const [updatedRows] = await Account.update(
    { status }, // Giá trị cần cập nhật
    { where: { account_id: user.account_id } } // Điều kiện: account_id từ User
  );

  console.log("Rows updated:", updatedRows);
  res.redirect("back");
};


module.exports.manageTechAccount = async (req, res) => {
  const accountId = req.params.id;
  const listTech = await Tech.findAll({
    attributes: ["technician_id", "name", "numberphone", "expertise", "employment_date"], // Chỉ định các trường từ bảng Tech
    include: [
      {
        model: Account,
        attributes: ["account_id", "avatar", "email", 'password',"status"], // Lấy trường avatar từ bảng Account
      },
    ],
  });
  res.render("admin/pages/manageTechAccount.pug",{
    title: "Manage User Account",
    userId: accountId,
    listTech: listTech
  });
};
// create tech account by admin
module.exports.createTech = async (req, res) =>{
  const account_id = req.params.id;
  console.log(account_id);
  res.render("admin/pages/createTech.pug",{
    title: "Create Tech Account",
    userId: account_id
  })
}

module.exports.createTechPost = async (req, res) =>{
  const accountId = req.params.id;

  try {
    const { avatar, name, email, password, numberphone, expertise, employment_date, address } = req.body;
    const account_type = "Technician";

    const existingAccount = await Account.findOne({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create the new account
    const account = await Account.create({
      email,
      password, 
      avatar,
      account_type,
      status: "Active", // Set the default status
    });
    const tech = await Tech.create({
      name,
      account_id: account.account_id,
      address,
      technician_id:`tech_${account.account_id}`,
      expertise,
      numberphone,
      employment_date
  });
  return res.redirect(`/admin/home/${accountId}/manageTechAccounts`);
} catch (error) {
  console.error("Error creating account or user:", error);
  return res.status(500).json({ message: "Internal server error" });
}
};

module.exports.deleteTech = async (req, res) => {
  const { userId, accountId } = req.params;
  // Xóa người dùng dựa trên userId
  await Tech.destroy({
    where: { technician_id: userId }
  });
  await Account.destroy({
    where: { account_id: accountId }
  });
  res.redirect("back");
};

module.exports.changeStatusTech = async (req, res) => {
  const { userId, status } = req.params; // Lấy thông tin từ params
  // Tìm người dùng trong bảng User
  const user = await Tech.findOne({ where: { technician_id: userId } });
    // Sử dụng account_id để cập nhật trạng thái trong bảng Account
  const [updatedRows] = await Account.update(
    { status }, 
    { where: { account_id: user.account_id } } // Điều kiện: account_id từ User
  );

  console.log("Rows updated:", updatedRows);
  res.redirect("back");
};

module.exports.manageIssue = async (req, res) => {
  const accountId = req.params.id;
  // Lấy danh sách sự cố và kỹ thuật viên
  const issues = await Issue.findAll({
    attributes: [
      "technician_id", "issue_id", "description", 
      "location", "latitude", "longitude", 
      "status", "report_date", "resolution_date"
    ],
  });
  const techs = await Tech.findAll({
    attributes: ["technician_id", "name", "expertise"],
  });
  // Map dữ liệu technician_id => name và expertise
  const techMap = {};
  techs.forEach(tech => {
    techMap[tech.technician_id] = `${tech.name} - ${tech.expertise}`;
  });

  const updatedIssues = issues.map(issue => {
    return {
      ...issue.dataValues,
      technician_info: techMap[issue.technician_id] || "Chưa có"
    };
  });

  res.render("admin/pages/manageIssue.pug", {
    title: "Manage Issue",
    userId: accountId,
    issue: updatedIssues, 
    techs: techs
  });
};


module.exports.fetchTech = async ( req, res) =>{
  const expertise = req.query.expertise;
  console.log(expertise);
  const technicians = await Tech.findAll({
    where: {expertise},
    attributes: ['technician_id', 'name', 'expertise']
  });
  console.log(technicians);
  return res.json(technicians);
}

module.exports.assignTech = async (req, res) => {
  console.log(req.body);
  const { issue_id, technician_id } = req.body;
  console.log(issue_id, technician_id);
  await Issue.update(
    { technician_id, status: 'In Progress'},
    {where: { issue_id: issue_id}}
  );
  res.send({ message: 'Phân công thành công'});
}