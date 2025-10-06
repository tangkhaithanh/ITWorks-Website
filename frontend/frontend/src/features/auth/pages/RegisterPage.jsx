import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center">
      <div className="container mx-auto px-6 py-4 sm:py-8 lg:py-12"> {/* Responsive padding */}
        <RegisterForm />
      </div>
    </div>
  );
};


export default RegisterPage;
