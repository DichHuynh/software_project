const Account = require("../model/accounts.model.js");
const Admin = require("../model/admin.model.js");
const Tech = require("../model/tech.model.js");

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
  res.render("admin/pages/manageUserAccount.pug",{
    title: "Manage User Account",
    userId: accountId
  });
};

module.exports.manageTechAccount = async (req, res) => {
  const accountId = req.params.id;
  const listTech = await Tech.findAll({
    attributes: ["technician_id", "name", "numberphone", "expertise", "employment_date"], // Chỉ định các trường từ bảng Tech
    include: [
      {
        model: Account,
        attributes: ["avatar", "email", 'password',"status"], // Lấy trường avatar từ bảng Account
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
    const account_type = "Tech";

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
  return res.redirect(`/admin/home/${accountId}`);
} catch (error) {
  console.error("Error creating account or user:", error);
  return res.status(500).json({ message: "Internal server error" });
}
};
