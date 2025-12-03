const SupplyChain = artifacts.require("SupplyChain");

contract("SupplyChain", (accounts) => {
  let supplyChain;
  const owner = accounts[0];
  const rmsAddress = accounts[1];
  const manAddress = accounts[2];
  const disAddress = accounts[3];
  const retAddress = accounts[4];

  beforeEach(async () => {
    supplyChain = await SupplyChain.new({ from: owner });
  });

  describe("Contract Deployment", () => {
    it("should set the deployer as owner", async () => {
      const contractOwner = await supplyChain.Owner();
      assert.equal(contractOwner, owner, "Owner should be the deployer");
    });
  });

  describe("Role Management", () => {
    it("should allow owner to add Raw Material Supplier", async () => {
      await supplyChain.addRMS(rmsAddress, "Test Supplier", "Test Place", { from: owner });
      const rms = await supplyChain.RMS(1);
      assert.equal(rms.addr, rmsAddress, "RMS address should match");
      assert.equal(rms.name, "Test Supplier", "RMS name should match");
    });

    it("should allow owner to add Manufacturer", async () => {
      await supplyChain.addManufacturer(manAddress, "Test Manufacturer", "Test Place", { from: owner });
      const man = await supplyChain.MAN(1);
      assert.equal(man.addr, manAddress, "Manufacturer address should match");
    });

    it("should allow owner to add Distributor", async () => {
      await supplyChain.addDistributor(disAddress, "Test Distributor", "Test Place", { from: owner });
      const dis = await supplyChain.DIS(1);
      assert.equal(dis.addr, disAddress, "Distributor address should match");
    });

    it("should allow owner to add Retailer", async () => {
      await supplyChain.addRetailer(retAddress, "Test Retailer", "Test Place", { from: owner });
      const ret = await supplyChain.RET(1);
      assert.equal(ret.addr, retAddress, "Retailer address should match");
    });

    it("should not allow non-owner to add roles", async () => {
      try {
        await supplyChain.addRMS(rmsAddress, "Test", "Test", { from: rmsAddress });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert for non-owner");
      }
    });
  });

  describe("Product Management", () => {
    beforeEach(async () => {
      // Add all required roles first
      await supplyChain.addRMS(rmsAddress, "RMS", "Place", { from: owner });
      await supplyChain.addManufacturer(manAddress, "MAN", "Place", { from: owner });
      await supplyChain.addDistributor(disAddress, "DIS", "Place", { from: owner });
      await supplyChain.addRetailer(retAddress, "RET", "Place", { from: owner });
    });

    it("should allow owner to add a product", async () => {
      await supplyChain.addMedicine("Test Product", "Test Description", { from: owner });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.id.toNumber(), 1, "Product ID should be 1");
      assert.equal(product.name, "Test Product", "Product name should match");
      assert.equal(product.stage, 0, "Initial stage should be Init (0)");
    });

    it("should not allow adding product without all roles", async () => {
      const newChain = await SupplyChain.new({ from: owner });
      try {
        await newChain.addMedicine("Test", "Test", { from: owner });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when roles are missing");
      }
    });

    it("should not allow non-owner to add product", async () => {
      try {
        await supplyChain.addMedicine("Test", "Test", { from: rmsAddress });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert for non-owner");
      }
    });
  });

  describe("Supply Chain Flow", () => {
    beforeEach(async () => {
      // Setup roles
      await supplyChain.addRMS(rmsAddress, "RMS", "Place", { from: owner });
      await supplyChain.addManufacturer(manAddress, "MAN", "Place", { from: owner });
      await supplyChain.addDistributor(disAddress, "DIS", "Place", { from: owner });
      await supplyChain.addRetailer(retAddress, "RET", "Place", { from: owner });
      // Add product
      await supplyChain.addMedicine("Test Product", "Description", { from: owner });
    });

    it("should allow RMS to supply raw materials", async () => {
      await supplyChain.RMSsupply(1, { from: rmsAddress });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.stage, 1, "Stage should be RawMaterialSupply");
      assert.equal(product.RMSid.toNumber(), 1, "RMS ID should be set");
    });

    it("should allow Manufacturer to manufacture", async () => {
      await supplyChain.RMSsupply(1, { from: rmsAddress });
      await supplyChain.Manufacturing(1, { from: manAddress });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.stage, 2, "Stage should be Manufacture");
      assert.equal(product.MANid.toNumber(), 1, "Manufacturer ID should be set");
    });

    it("should allow Distributor to distribute", async () => {
      await supplyChain.RMSsupply(1, { from: rmsAddress });
      await supplyChain.Manufacturing(1, { from: manAddress });
      await supplyChain.Distribute(1, { from: disAddress });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.stage, 3, "Stage should be Distribution");
      assert.equal(product.DISid.toNumber(), 1, "Distributor ID should be set");
    });

    it("should allow Retailer to receive product", async () => {
      await supplyChain.RMSsupply(1, { from: rmsAddress });
      await supplyChain.Manufacturing(1, { from: manAddress });
      await supplyChain.Distribute(1, { from: disAddress });
      await supplyChain.Retail(1, { from: retAddress });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.stage, 4, "Stage should be Retail");
      assert.equal(product.RETid.toNumber(), 1, "Retailer ID should be set");
    });

    it("should allow Retailer to mark product as sold", async () => {
      await supplyChain.RMSsupply(1, { from: rmsAddress });
      await supplyChain.Manufacturing(1, { from: manAddress });
      await supplyChain.Distribute(1, { from: disAddress });
      await supplyChain.Retail(1, { from: retAddress });
      await supplyChain.sold(1, { from: retAddress });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.stage, 5, "Stage should be sold");
    });

    it("should enforce correct stage transitions", async () => {
      try {
        await supplyChain.Manufacturing(1, { from: manAddress });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert for incorrect stage");
      }
    });
  });

  describe("IPFS Hash Management", () => {
    beforeEach(async () => {
      await supplyChain.addRMS(rmsAddress, "RMS", "Place", { from: owner });
      await supplyChain.addManufacturer(manAddress, "MAN", "Place", { from: owner });
      await supplyChain.addDistributor(disAddress, "DIS", "Place", { from: owner });
      await supplyChain.addRetailer(retAddress, "RET", "Place", { from: owner });
      await supplyChain.addMedicine("Test Product", "Description", { from: owner });
    });

    it("should allow owner to update IPFS hash", async () => {
      const testHash = "QmTestHash123";
      await supplyChain.updateIPFSHash(1, testHash, { from: owner });
      const product = await supplyChain.MedicineStock(1);
      assert.equal(product.ipfsHash, testHash, "IPFS hash should be updated");
    });

    it("should not allow non-owner to update IPFS hash", async () => {
      try {
        await supplyChain.updateIPFSHash(1, "test", { from: rmsAddress });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert for non-owner");
      }
    });
  });

  describe("Events", () => {
    beforeEach(async () => {
      await supplyChain.addRMS(rmsAddress, "RMS", "Place", { from: owner });
      await supplyChain.addManufacturer(manAddress, "MAN", "Place", { from: owner });
      await supplyChain.addDistributor(disAddress, "DIS", "Place", { from: owner });
      await supplyChain.addRetailer(retAddress, "RET", "Place", { from: owner });
    });

    it("should emit ProductRegistered event when product is added", async () => {
      const tx = await supplyChain.addMedicine("Test", "Desc", { from: owner });
      assert.equal(tx.logs.length, 1, "Should emit one event");
      assert.equal(tx.logs[0].event, "ProductRegistered", "Event should be ProductRegistered");
    });

    it("should emit ProductTransferred event on stage change", async () => {
      await supplyChain.addMedicine("Test", "Desc", { from: owner });
      const tx = await supplyChain.RMSsupply(1, { from: rmsAddress });
      const event = tx.logs.find(log => log.event === "ProductTransferred");
      assert(event !== undefined, "Should emit ProductTransferred event");
    });
  });
});

