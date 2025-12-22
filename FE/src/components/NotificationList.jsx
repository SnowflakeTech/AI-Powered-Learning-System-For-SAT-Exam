export default function NotificationList() {
  const posts = [
    {
      title: "Phát hành PHIẾU BÁO DỰ THI - PHIẾU BÁO ĐIỂM",
      date: "07/03/2025",
      image: "/notice1.png",
      excerpt:
        "Hội đồng thi phát hành PHIẾU BÁO DỰ THI và PHIẾU BÁO ĐIỂM các đợt thi năm 2025.",
    },
    {
      title: "Sửa hồ sơ thí sinh sau khi chọn ca thi",
      date: "25/02/2025",
      image: "/notice2.png",
      excerpt:
        "Viện Đào tạo hướng dẫn thí sinh sửa hồ sơ đăng ký thi HSA sau khi chọn ca thi.",
    },
    {
      title: "Nộp lệ phí ca thi đã đăng ký",
      date: "24/02/2025",
      image: "/notice3.png",
      excerpt:
        "Thí sinh đã đăng ký thành công ca thi nên nộp lệ phí trước 96 giờ.",
    },
  ];

  return (
    <div className="space-y-4">
      {posts.map((item, i) => (
        <div
          key={i}
          className="bg-white shadow-md rounded-lg p-3 hover:shadow-xl transition cursor-pointer"
        >
          <div className="flex gap-3">
            <img
              src={item.image}
              className="w-20 h-20 object-cover rounded-md"
            />
            <div className="flex flex-col justify-between">
              <h3 className="font-bold text-gray-800">{item.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {item.excerpt}
              </p>
              <p className="text-blue-700 text-sm font-semibold">
                {item.date}
              </p>
            </div>
          </div>
        </div>
      ))}

      <a
        href="#"
        className="text-blue-600 text-right block font-semibold hover:underline"
      >
        Xem thêm bài đăng →
      </a>
    </div>
  );
}

